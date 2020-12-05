using GraphQL.Client.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Watchdog.Detector;
using Watchdog.Models;
using GraphQL.Client.Abstractions;
using GraphQL;
using System.Linq;

namespace Watchdog
{
	public class DetectorWorker : BackgroundService
	{
		private readonly int refreshRate;
		private const int TWO_SECONDS = 2000;
		private readonly IConfiguration config;
		private readonly ILogger<DetectorWorker> logger;
		private readonly DetectorService detectorService;
		private readonly IServiceScopeFactory scopeFactory;
		private readonly GraphQLHttpClient graphQLHttpClient;

		public DetectorWorker(IConfiguration config, ILogger<DetectorWorker> logger, DetectorService detectorService, IServiceScopeFactory scopeFactory, GraphQLHttpClient graphQLHttpClient)
		{
			this.config = config;
			this.logger = logger;
			this.detectorService = detectorService;
			this.scopeFactory = scopeFactory;
			this.graphQLHttpClient = graphQLHttpClient;
			refreshRate = config.GetValue<int>("RefreshRate") * 1000; //convert seconds to milliseconds.
		}

		protected override async Task ExecuteAsync(CancellationToken stoppingToken)
		{
			try
			{				
				logger.LogInformation("Start");
				logger.LogInformation($"App Settings Refresh Rate set to {refreshRate / 1000} seconds.");

				var shouldQuit = false;
				var targetPath = string.Empty;
				var objectDetectionUri = string.Empty;				

				while (string.IsNullOrEmpty(detectorService.TargetPath))
				{
					await detectorService.LoadTargetPath();
					targetPath = detectorService.TargetPath;
					if (!string.IsNullOrEmpty(detectorService.TargetPath)) break;

					logger.LogError("Detection will not start because Target Path is not configured. Retrying...");
					Task.Delay(refreshRate).GetAwaiter().GetResult();
				}

				while (detectorService.ObjectDetectionUri is null)
				{
					await detectorService.LoadObjectDetectionUri();
					objectDetectionUri = detectorService.ObjectDetectionUri?.ToString() ?? string.Empty;

					if (detectorService.ObjectDetectionUri is not null) break;
					logger.LogError("Detection will not start because Object Detection Uri not configured. Retrying...");
					Task.Delay(refreshRate).GetAwaiter().GetResult();
				}

				new Timer(callback: async _ => await detectorService.LoadCameras(), state: null, dueTime: 0, period: refreshRate);

				new Timer(callback: async _ =>
				{
					await detectorService.LoadTargetPath();
					if (targetPath != detectorService.TargetPath && !string.IsNullOrEmpty(detectorService.TargetPath)) detectorService.Restart();
				}, state: null, dueTime: refreshRate, period: refreshRate);

				new Timer(callback: async _ => await detectorService.LoadObjectDetectionUri(), state: null, dueTime: refreshRate, period: refreshRate);

				new Timer(callback: _ =>
				{
					if (stoppingToken.IsCancellationRequested && !shouldQuit)
					{
						detectorService.Quit();
						shouldQuit = true;
					}

				}, state: null, dueTime: 0, period: TWO_SECONDS);

				detectorService.Run();

				logger.LogInformation("Exiting...");
			}
			catch (Exception ex)
			{
				logger.LogError(ex.ToString());
			}
			
		}

	}
}

