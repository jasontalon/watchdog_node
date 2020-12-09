using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Watchdog.Detector;

namespace Watchdog
{
	public class Program
	{		
		public static void Main(string[] args)
		{
			Log.Logger = new LoggerConfiguration()
				.WriteTo.Console()
				.WriteTo.File(path: ".\\logs\\log-.txt", rollingInterval: RollingInterval.Day, outputTemplate: "[{Timestamp:HH:mm:ss} {SourceContext}.{Method} {Level:u4}] {Message:lj}{NewLine}{Exception}")
				.MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning)
				.MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
				.CreateLogger();

			CreateHostBuilder(args).Build().Run();
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
				.UseWindowsService()
				.UseSerilog()
				.ConfigureServices((hostContext, services) =>
				{
					services.AddTransient(serviceProvider =>
					{
						var config = serviceProvider.GetService<IConfiguration>();
						var endpoint = config.GetValue<string>("GraphQL:Endpoint");
						var secret = config.GetValue<string>("GraphQL:AdminSecret");
						var client = new GraphQLHttpClient(endpoint, new NewtonsoftJsonSerializer());
						client.Options.UseWebSocketForQueriesAndMutations = false;
						
						client.HttpClient.DefaultRequestHeaders.Add("X-HASURA-ADMIN-SECRET", secret);						
						return client;
					});
					services.AddTransient<DetectorService>();
					services.AddHostedService<DetectorWorker>();
				});
	}
}
