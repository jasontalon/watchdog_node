using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using GraphQL.Client.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Watchdog.Models;
using GraphQL.Client.Abstractions;
using Watchdog.Models.GraphQL;

namespace Watchdog.Detector
{
	public class DetectorService
	{
		public DetectorService(ILogger<DetectorService> logger, GraphQLHttpClient graphQLHttpClient)
		{
			this.logger = logger;
			this.graphQLHttpClient = graphQLHttpClient;
		}
		private const string TARGET_PATH = "TARGET_PATH";
		private const string OBJECT_DETECTION_URI = "OBJECT_DETECTION_URI";
		private const string PREDICT_PATH = "models/yolov4/predict";
		private readonly ILogger<DetectorService> logger;
		private readonly GraphQLHttpClient graphQLHttpClient;

		private bool shouldQuit { get; set; }
		private bool shouldRestart { get; set; }
		public string TargetPath { get; set; }
		public Uri ObjectDetectionUri { get; set; }

		public List<Camera> Cameras { get; set; }

		private DetectorResults identify(string filePath)
		{
			using (var client = new WebClient())
			{
				try
				{
					Uri address = new(ObjectDetectionUri, PREDICT_PATH);

					var multipart = new MultipartFormBuilder();

					multipart.AddFile("input_data", new FileInfo(filePath));

					Thread.Sleep(15); //minimize thread race condition issue during file reads
					var responseBytes = client.UploadMultipart(address, multipart);

					return JsonConvert.DeserializeObject<DetectorResults>(Encoding.UTF8.GetString(responseBytes));
				}
				catch (Exception ex)
				{
					logger.LogError(ex.Message);
					return null;
				}
			}
		}

		public void Restart()
		{
			shouldRestart = true;
			shouldQuit = true;
		}

		public void Quit()
		{
			shouldQuit = true;
		}

		private async void onCreated(object source, FileSystemEventArgs e)
		{			
			var camera = Cameras?.FirstOrDefault(p => e.Name.StartsWith(p.FilePattern));
			if ((camera?.Targets?.Count ?? 0) == 0) return;

			var watch = System.Diagnostics.Stopwatch.StartNew();
			if (!File.Exists(e.FullPath)) return;

			var identityResults = identify(e.FullPath);
			var results = identityResults?.Data.BoundingBoxes.Where(p => camera.Targets.Any(c => c.ClassName == p.ObjectClassName && (c.MaxConfidence >= p.Confidence && c.MinConfidence <= p.Confidence) && c.Enabled)).ToList();

			if ((results?.Count ?? 0) > 0) await saveToDb(camera.CameraId, e.FullPath, results);

			watch.Stop();

			var items = results?.Select(p => p.ObjectClassName).Distinct().OrderBy(i => i).ToList() ?? new List<string>();

			logger.LogInformation(string.Format("[{0}ms] {1} {2}",
				watch.ElapsedMilliseconds,
				e.Name,
				items.Count > 0 ? $"{items.Count} found. [{string.Join(",", items)}]" : "[n/a]"));
		}

		private async Task saveToDb(string cameraId, string file, List<BoundingBox> items)
		{
			try
			{				
				var payload = new InsertCapturePayload
				{
					Capture = new Models.GraphQL.Capture
					{
						CameraId = cameraId,
						ImageName = Path.GetFileName(file),
						ImageBase64 = Convert.ToBase64String(File.ReadAllBytes(file)),
						BoundingBoxes =  new BoundingBoxes
						{
							Data = items.Select((p, idx) => new Datum{
								ClassName = p.ObjectClassName,
								Confidence = Convert.ToInt64(p.Confidence),
								Seq = idx,
								Bottom = p.Coordinates.Bottom, Left = p.Coordinates.Left, Right = p.Coordinates.Right, Top = p.Coordinates.Top  }).ToList()
						}
					}
				};

				var response = await graphQLHttpClient.SendMutationAsync<object>( new GraphQL.GraphQLRequest { Query = GraphQlMutations.SaveCaptures, Variables = payload });

				var errors = string.Join(", ", response.Errors?.Select(p => p.Message) ?? new List<string>());

				if (!string.IsNullOrEmpty(errors)) logger.LogError(errors);
			}
			catch (Exception ex)
			{
				logger.LogError(ex.Message);
			}
		}

		public void Run()
		{
			using (var watcher = new FileSystemWatcher(TargetPath, "*.jpg"))
			{
				watcher.Created += onCreated;
				watcher.EnableRaisingEvents = true;
				logger.LogInformation($"Watching {TargetPath}");
				while (!shouldQuit) ;
			}

			if (shouldRestart)
			{
				logger.LogInformation("Restarting...");
				shouldQuit = false;
				shouldRestart = false;
				Run();
			}
		}

		public async Task LoadCameras()
		{
			var response = await graphQLHttpClient.SendQueryAsync<CamerasResponse>(GraphQLQueries.GetAllCameras);
			Cameras = response?.Data?.Cameras ?? new List<Camera>();
			logger.LogInformation("Cameras " + (Cameras.Count > 0 ? $"Loaded [{string.Join(", ", Cameras.Select(p => p.CameraName))}]" : "is empty"));
		}

		public async Task LoadTargetPath()
		{
			var response = await graphQLHttpClient.SendQueryAsync(request: new GraphQL.GraphQLRequest
			(GraphQLQueries.GetConfigsByName, new { name = TARGET_PATH }), () => new ConfigsResponse());

			TargetPath = response.Data.Configs.FirstOrDefault()?.Value ?? string.Empty;			
		}

		public async Task LoadObjectDetectionUri()
		{
			var response = await graphQLHttpClient.SendQueryAsync<ConfigsResponse>(request: new GraphQL.GraphQLRequest
			(GraphQLQueries.GetConfigsByName, new { name = OBJECT_DETECTION_URI }));

			var uri = response?.Data?.Configs?.FirstOrDefault()?.Value ?? string.Empty;

			if (!string.IsNullOrEmpty(uri)) ObjectDetectionUri = new Uri(uri);
		}
	}

}
