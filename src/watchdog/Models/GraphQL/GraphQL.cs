using System.Collections.Generic;
using Newtonsoft.Json;

namespace Watchdog.Models.GraphQL
{
	public partial class InsertCapturePayload
	{
		[JsonProperty("capture", NullValueHandling = NullValueHandling.Ignore)]
		public Capture Capture { get; set; }
	}

	public partial class Capture
	{
		[JsonProperty("camera_id", NullValueHandling = NullValueHandling.Ignore)]
		public string CameraId { get; set; }

		[JsonProperty("image_name", NullValueHandling = NullValueHandling.Ignore)]
		public string ImageName { get; set; }

		[JsonProperty("image_base64", NullValueHandling = NullValueHandling.Ignore)]
		public string? ImageBase64 { get; set; }

		[JsonProperty("bounding_boxes", NullValueHandling = NullValueHandling.Ignore)]
		public BoundingBoxes BoundingBoxes { get; set; }
	}

	public partial class BoundingBoxes
	{
		[JsonProperty("data", NullValueHandling = NullValueHandling.Ignore)]
		public List<Datum> Data { get; set; }
	}

	public partial class Datum
	{
		[JsonProperty("bottom", NullValueHandling = NullValueHandling.Ignore)]
		public long? Bottom { get; set; }

		[JsonProperty("class_name", NullValueHandling = NullValueHandling.Ignore)]
		public string ClassName { get; set; }

		[JsonProperty("confidence", NullValueHandling = NullValueHandling.Ignore)]
		public long? Confidence { get; set; }

		[JsonProperty("top", NullValueHandling = NullValueHandling.Ignore)]
		public long? Top { get; set; }

		[JsonProperty("left", NullValueHandling = NullValueHandling.Ignore)]
		public long? Left { get; set; }

		[JsonProperty("right", NullValueHandling = NullValueHandling.Ignore)]
		public long? Right { get; set; }

		[JsonProperty("seq", NullValueHandling = NullValueHandling.Ignore)]
		public long? Seq { get; set; }
	}

	public class ConfigsResponse
	{
		public List<Config> Configs;
	}

	public class CamerasResponse
	{
		public List<Camera> Cameras;
	}
}
