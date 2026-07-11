using System;
using System.Net.Http;
using System.Threading.Tasks;
using Windows.ApplicationModel;
using Windows.Data.Json;

namespace ArtistWayUWP.Services
{
    public sealed class UpdateCheckResult
    {
        public bool Success { get; set; }
        public string Latest { get; set; }
        public bool UpdateAvailable { get; set; }
        public string Error { get; set; }
    }

    // Substitui www/js/updates.js: como agora tudo roda nativo (sem
    // WebView), a checagem é uma chamada HTTP direta, sem a restrição de
    // "conteúdo local" que bloqueava o fetch() antes.
    public static class UpdateCheckService
    {
        private const string VersionUrl = "https://ro2342.github.io/theartistsway/app/version.json";
        public const string DownloadPageUrl = "https://ro2342.github.io/theartistsway/app/";

        public static string GetInstalledVersion()
        {
            PackageVersion v = Package.Current.Id.Version;
            return $"{v.Major}.{v.Minor}.{v.Build}.{v.Revision}";
        }

        public static int CompareVersions(string a, string b)
        {
            string[] pa = a.Split('.');
            string[] pb = b.Split('.');
            int len = Math.Max(pa.Length, pb.Length);
            for (int i = 0; i < len; i++)
            {
                int na = i < pa.Length && int.TryParse(pa[i], out int va) ? va : 0;
                int nb = i < pb.Length && int.TryParse(pb[i], out int vb) ? vb : 0;
                if (na != nb)
                {
                    return na - nb;
                }
            }
            return 0;
        }

        public static async Task<UpdateCheckResult> CheckAsync()
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(10);
                    string json = await client.GetStringAsync(new Uri(VersionUrl));
                    JsonObject obj = JsonObject.Parse(json);
                    string latest = obj.GetNamedString("version");
                    string installed = GetInstalledVersion();
                    return new UpdateCheckResult
                    {
                        Success = true,
                        Latest = latest,
                        UpdateAvailable = CompareVersions(latest, installed) > 0,
                    };
                }
            }
            catch (Exception ex)
            {
                return new UpdateCheckResult { Success = false, Error = ex.Message };
            }
        }
    }
}
