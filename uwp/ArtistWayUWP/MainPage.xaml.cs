using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.ApplicationModel;
using Windows.Data.Json;
using Windows.Data.Xml.Dom;
using Windows.Foundation.Metadata;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.UI;
using Windows.UI.Notifications;
using Windows.UI.ViewManagement;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ArtistWayUWP
{
    /// <summary>
    /// Hospeda o Companheiro do Artist's Way (HTML/CSS/JS, o mesmo código da
    /// versão PWA/APK) dentro de uma WebView em tela cheia. O JavaScript conversa
    /// com este C# via window.external.notify(JSON), usado para agendar
    /// notificações nativas do Windows e abrir links externos (Google Calendar).
    /// </summary>
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            try
            {
                this.InitializeComponent();
                this.Loaded += MainPage_Loaded;
                ApplyStatusBarColors();
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao iniciar a página: " + ex.Message);
            }
        }

        // A StatusBar (hora, wifi, bateria) usa ícones claros por padrão (tema
        // escuro do sistema), que ficam invisíveis no fundo claro do app.
        private void ApplyStatusBarColors()
        {
            if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
            {
                StatusBar statusBar = StatusBar.GetForCurrentView();
                statusBar.ForegroundColor = Color.FromArgb(255, 0x35, 0x30, 0x1F);
                statusBar.BackgroundColor = Color.FromArgb(255, 0xE9, 0xE2, 0xD0);
                statusBar.BackgroundOpacity = 1;
            }
        }

        private void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                MainWebView.NavigationFailed += MainWebView_NavigationFailed;
                MainWebView.Navigate(new Uri("ms-appx-web:///www/index.html"));
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao carregar o app: " + ex.Message);
            }
        }

        private void MainWebView_NavigationFailed(object sender, WebViewNavigationFailedEventArgs e)
        {
            ShowFatalError("Falha ao navegar para o conteúdo local: " + e.WebErrorStatus);
        }

        // Injeta a versão do pacote instalado no contexto JS, pra que
        // www/js/updates.js consiga comparar com a última versão publicada
        // no site (ver window.__ARTISTWAY_NATIVE_VERSION).
        private async void MainWebView_NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs e)
        {
            try
            {
                PackageVersion version = Package.Current.Id.Version;
                string versionStr = $"{version.Major}.{version.Minor}.{version.Build}.{version.Revision}";
                string script = "window.__ARTISTWAY_NATIVE_VERSION = " + EscapeJsString(versionStr) + ";";
                await MainWebView.InvokeScriptAsync("eval", new[] { script });
            }
            catch (Exception)
            {
                // Sem versão nativa disponível: o app continua funcionando
                // normalmente, só sem o checador de atualização.
            }
        }

        private void ShowFatalError(string message)
        {
            if (ErrorText != null && ErrorPanel != null)
            {
                ErrorText.Text = message;
                ErrorPanel.Visibility = Visibility.Visible;
            }
        }

        private void MainWebView_ScriptNotify(object sender, NotifyEventArgs e)
        {
            try
            {
                JsonObject data = JsonObject.Parse(e.Value);
                string type = GetStringOrNull(data, "type");

                switch (type)
                {
                    case "scheduleNotifications":
                        ScheduleNotifications(data);
                        break;
                    case "openUri":
                        string url = GetStringOrNull(data, "url");
                        if (!string.IsNullOrEmpty(url))
                        {
                            OpenUri(url);
                        }
                        break;
                    case "exportData":
                        string exportFilename = GetStringOrNull(data, "filename") ?? "artist-way-backup.json";
                        string exportContent = GetStringOrNull(data, "content") ?? "";
                        ExportData(exportFilename, exportContent);
                        break;
                    case "importRequest":
                        ImportData();
                        break;
                }
            }
            catch (Exception)
            {
                // Mensagem malformada vinda do JS: ignora silenciosamente.
                // Nada aqui é crítico o bastante para justificar travar a UI.
            }
        }

        // ---------- Notificações ----------

        private void ScheduleNotifications(JsonObject data)
        {
            ToastNotifier notifier = ToastNotificationManager.CreateToastNotifier();

            // Remove tudo que já estava agendado antes de recriar, para não
            // empilhar notificações duplicadas quando o usuário muda os horários.
            foreach (ScheduledToastNotification scheduled in notifier.GetScheduledToastNotifications())
            {
                notifier.RemoveFromSchedule(scheduled);
            }

            string morningPagesTime = GetStringOrNull(data, "morningPagesTime");
            if (!string.IsNullOrEmpty(morningPagesTime) && TryParseTime(morningPagesTime, out int mpHour, out int mpMinute))
            {
                ScheduleDaily(
                    notifier,
                    "morningPages",
                    "Hora das Morning Pages \u270D\uFE0F",
                    "Três páginas, sem reler. Só você e o papel.",
                    mpHour,
                    mpMinute,
                    daysAhead: 30);
            }

            int? artistDateDay = GetIntOrNull(data, "artistDateDay");
            string artistDateTime = GetStringOrNull(data, "artistDateTime");
            if (artistDateDay.HasValue && !string.IsNullOrEmpty(artistDateTime) && TryParseTime(artistDateTime, out int adHour, out int adMinute))
            {
                ScheduleWeekly(
                    notifier,
                    "artistDate",
                    "Que tal um Artist Date? \uD83C\uDFA8",
                    "Reserve um tempinho sozinho(a) essa semana, só por prazer.",
                    artistDateDay.Value,
                    adHour,
                    adMinute,
                    occurrences: 12);
            }

            int? checkinDay = GetIntOrNull(data, "checkinDay");
            string checkinTime = GetStringOrNull(data, "checkinTime");
            if (checkinDay.HasValue && !string.IsNullOrEmpty(checkinTime) && TryParseTime(checkinTime, out int ciHour, out int ciMinute))
            {
                ScheduleWeekly(
                    notifier,
                    "checkin",
                    "Check-in semanal \uD83D\uDCD3",
                    "Hora de revisar como foi sua semana criativa.",
                    checkinDay.Value,
                    ciHour,
                    ciMinute,
                    occurrences: 12);
            }
        }

        // Agenda notificações diárias para os próximos `daysAhead` dias a partir
        // de agora. ScheduledToastNotification não tem recorrência nativa, então
        // criamos um lote de ocorrências futuras; o lote é recriado toda vez que
        // o usuário salva os ajustes (ver ScheduleNotifications acima).
        private void ScheduleDaily(ToastNotifier notifier, string tag, string title, string body, int hour, int minute, int daysAhead)
        {
            DateTimeOffset now = DateTimeOffset.Now;
            DateTimeOffset first = new DateTimeOffset(now.Year, now.Month, now.Day, hour, minute, 0, now.Offset);
            if (first <= now)
            {
                first = first.AddDays(1);
            }

            for (int i = 0; i < daysAhead; i++)
            {
                DateTimeOffset deliveryTime = first.AddDays(i);
                ScheduledToastNotification scheduled = new ScheduledToastNotification(BuildToastXml(title, body), deliveryTime)
                {
                    Tag = tag + "-" + i,
                    Group = tag,
                };
                notifier.AddToSchedule(scheduled);
            }
        }

        // Agenda notificações semanais, num dia da semana específico, para as
        // próximas `occurrences` semanas. Convenção de dia da semana: 1=domingo
        // ... 7=sábado (a mesma usada no resto do app, em app.js/calendar.js).
        private void ScheduleWeekly(ToastNotifier notifier, string tag, string title, string body, int ourWeekday, int hour, int minute, int occurrences)
        {
            DayOfWeek targetDayOfWeek = (DayOfWeek)(ourWeekday - 1);
            DateTimeOffset now = DateTimeOffset.Now;
            DateTimeOffset candidate = new DateTimeOffset(now.Year, now.Month, now.Day, hour, minute, 0, now.Offset);

            int diff = ((int)targetDayOfWeek - (int)candidate.DayOfWeek + 7) % 7;
            if (diff == 0 && candidate <= now)
            {
                diff = 7;
            }
            candidate = candidate.AddDays(diff);

            for (int i = 0; i < occurrences; i++)
            {
                DateTimeOffset deliveryTime = candidate.AddDays(7 * i);
                ScheduledToastNotification scheduled = new ScheduledToastNotification(BuildToastXml(title, body), deliveryTime)
                {
                    Tag = tag + "-" + i,
                    Group = tag,
                };
                notifier.AddToSchedule(scheduled);
            }
        }

        private static XmlDocument BuildToastXml(string title, string body)
        {
            string xml =
                "<toast>" +
                  "<visual>" +
                    "<binding template=\"ToastGeneric\">" +
                      "<text>" + EscapeXml(title) + "</text>" +
                      "<text>" + EscapeXml(body) + "</text>" +
                    "</binding>" +
                  "</visual>" +
                "</toast>";

            XmlDocument doc = new XmlDocument();
            doc.LoadXml(xml);
            return doc;
        }

        // ---------- Abrir links externos (Google Calendar) ----------

        private async void OpenUri(string url)
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out Uri uri))
            {
                await Windows.System.Launcher.LaunchUriAsync(uri);
            }
        }

        // ---------- Backup: exportar/importar (a WebView UWP legada não
        // dispara o download via Blob + <a download>, então isso usa os
        // pickers nativos de arquivo em vez do fluxo padrão do navegador).
        // Não deixamos nenhuma falha aqui silenciosa -- o resultado (sucesso,
        // cancelamento ou erro com mensagem) sempre volta pro JS, pra nunca
        // mais parecer que "não fez nada" sem explicação. ----------

        private async void ExportData(string filename, string content)
        {
            JsonObject result = new JsonObject();
            try
            {
                // Sem SuggestedStartLocation: no Windows 10 Mobile nem toda
                // PickerLocationId (ex.: DocumentsLibrary) corresponde a uma
                // pasta real, e isso pode derrubar o picker com uma exceção
                // -- deixa o próprio seletor escolher o ponto de partida.
                FileSavePicker savePicker = new FileSavePicker
                {
                    SuggestedFileName = filename,
                };
                savePicker.FileTypeChoices.Add("Arquivo JSON", new List<string> { ".json" });

                StorageFile file = await savePicker.PickSaveFileAsync();
                if (file != null)
                {
                    await FileIO.WriteTextAsync(file, content);
                    result["success"] = JsonValue.CreateBooleanValue(true);
                }
                else
                {
                    result["success"] = JsonValue.CreateBooleanValue(false);
                    result["canceled"] = JsonValue.CreateBooleanValue(true);
                }
            }
            catch (Exception ex)
            {
                result["success"] = JsonValue.CreateBooleanValue(false);
                result["error"] = JsonValue.CreateStringValue(ex.Message);
            }

            await InvokeJsCallback("window.__onNativeExportResult", result);
        }

        private async void ImportData()
        {
            JsonObject result = new JsonObject();
            try
            {
                FileOpenPicker openPicker = new FileOpenPicker();
                openPicker.FileTypeFilter.Add(".json");

                StorageFile file = await openPicker.PickSingleFileAsync();
                if (file != null)
                {
                    string content = await FileIO.ReadTextAsync(file);
                    result["success"] = JsonValue.CreateBooleanValue(true);
                    result["content"] = JsonValue.CreateStringValue(content);
                }
                else
                {
                    result["success"] = JsonValue.CreateBooleanValue(false);
                    result["canceled"] = JsonValue.CreateBooleanValue(true);
                }
            }
            catch (Exception ex)
            {
                result["success"] = JsonValue.CreateBooleanValue(false);
                result["error"] = JsonValue.CreateStringValue(ex.Message);
            }

            await InvokeJsCallback("window.__onNativeImportResult", result);
        }

        // JsonObject.Stringify() já produz um literal válido tanto em JSON
        // quanto em JS, então não precisa de nenhuma escapada manual aqui.
        private async Task InvokeJsCallback(string functionName, JsonObject payload)
        {
            try
            {
                string script = functionName + " && " + functionName + "(" + payload.Stringify() + ");";
                await MainWebView.InvokeScriptAsync("eval", new[] { script });
            }
            catch (Exception)
            {
                // Sem callback registrado do lado JS -- ignora.
            }
        }

        private static string EscapeJsString(string s)
        {
            if (s == null)
            {
                return "null";
            }
            return "'" + s
                .Replace("\\", "\\\\")
                .Replace("'", "\\'")
                .Replace("\r", "\\r")
                .Replace("\n", "\\n") + "'";
        }

        // ---------- Helpers ----------

        private static string GetStringOrNull(JsonObject obj, string key)
        {
            if (obj != null && obj.ContainsKey(key) && obj[key].ValueType == JsonValueType.String)
            {
                return obj[key].GetString();
            }
            return null;
        }

        private static int? GetIntOrNull(JsonObject obj, string key)
        {
            if (obj != null && obj.ContainsKey(key) && obj[key].ValueType == JsonValueType.Number)
            {
                return (int)obj[key].GetNumber();
            }
            return null;
        }

        private static bool TryParseTime(string hhmm, out int hour, out int minute)
        {
            hour = 0;
            minute = 0;
            if (string.IsNullOrEmpty(hhmm))
            {
                return false;
            }
            string[] parts = hhmm.Split(':');
            if (parts.Length != 2)
            {
                return false;
            }
            return int.TryParse(parts[0], out hour) && int.TryParse(parts[1], out minute);
        }

        private static string EscapeXml(string s)
        {
            if (s == null)
            {
                return "";
            }
            return s
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&apos;");
        }
    }
}
