using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Watchdog.Models
{
    public class Log
	{
        public string File { get; set; }
        public string CapturedAtUtc { get; set; }
	}
    public class Config
	{
		public string Name { get; set; }
		public string Value { get; set; }
	}
    public class Camera
	{
        [JsonProperty("camera_id")]
        public string CameraId { get; set; }
        [JsonProperty("camera_name")]
        public string CameraName { get; set; }
		public string Description { get; set; }
        [JsonProperty("file_pattern")]
        public string FilePattern { get; set; }
		public bool Enabled { get; set; }

        public virtual List<Target> Targets { get; set; }
        public virtual List<Capture> Captures { get; set; }
	}

    public class Target
	{
        public virtual Camera Camera { get; set; }
        [JsonProperty("camera_id")]
        public string CameraId { get; set; }
        [JsonProperty("class_name")]
        public string ClassName { get; set; }
        [JsonProperty("min_confidence")]
        public double MinConfidence { get; set; }
        [JsonProperty("max_confidence")]
        public double MaxConfidence { get; set; }
        public bool Enabled { get; set; }
	}

    public class Capture
	{
        public virtual Camera Camera { get; set; }
        public string File { get; set; }           
        public string CameraId { get; set; }
        public string Base64Image { get; set; }
        public DateTime CapturedAtUtc { get; set; }
        public virtual List<BoundingBox> BoundingBoxes { get; set; }
    }

    public class BoundingBox
    {        
        public virtual Capture Capture { get; set; }
        public string File { get; set; }
        public int Seq { get; set; }
        public string ClassName { get; set; }
        public double Confidence { get; set; }
        public long Left { get; set; }        
        public long Right { get; set; }        
        public long Top { get; set; }
        public long Bottom { get; set; }        
    }


    
}
