namespace Watchdog.Detector
{
	public static class GraphQLQueries
	{
		public static string GetConfigsByName = @"query MyQuery ($name :String) {
					  configs(where: {name: {_eq: $name}}) {
						value
					  } }";

		public static string GetAllCameras = @"query GetCameras {
					  cameras(where: {enabled: {_eq: true}, targets: {enabled: {_eq: true}}}) {
						camera_id
						camera_name
						file_pattern
						enabled
						targets(where: {enabled: {_eq: true}}) {
						  class_name
						  max_confidence
						  min_confidence      
						  enabled
						}
					  }
					}
					";
	}

	public static class GraphQlMutations
	{
		public static string SaveCaptures = @"mutation SaveCapture($capture: captures_insert_input!) {
					  insert_captures_one(object: $capture) {
						camera_id
					  }
					}
					";
	}
}
