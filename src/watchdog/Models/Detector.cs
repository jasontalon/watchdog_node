
using System.Collections.Generic;

using Newtonsoft.Json;
namespace Watchdog.Detector
{
  public class DetectorResults
  {
    [JsonProperty("data")]
    public Data Data { get; set; }

    [JsonProperty("error")]
    public string Error { get; set; }

    [JsonProperty("success")]
    public bool Success { get; set; }
  }

  public partial class Data
  {
    [JsonProperty("bounding-boxes")]
    public List<BoundingBox> BoundingBoxes { get; set; }
  }

  public partial class BoundingBox
  {
    [JsonProperty("ObjectClassName")]
    public string ObjectClassName { get; set; }

    [JsonProperty("ObjectClassId")]
    public long ObjectClassId { get; set; }

    [JsonProperty("confidence")]
    public double Confidence { get; set; }

    [JsonProperty("coordinates")]
    public Coordinates Coordinates { get; set; }
  }

  public partial class Coordinates
  {
    [JsonProperty("left")]
    public long Left { get; set; }

    [JsonProperty("right")]
    public long Right { get; set; }

    [JsonProperty("top")]
    public long Top { get; set; }

    [JsonProperty("bottom")]
    public long Bottom { get; set; }
  }

}