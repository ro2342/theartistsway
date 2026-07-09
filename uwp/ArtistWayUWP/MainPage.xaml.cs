using System;
using Windows.Data.Json;
using Windows.Data.Xml.Dom;
using Windows.UI.Notifications;
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
            }
            catch (Exception ex)
            {
                ShowFatalError("Erro ao iniciar a página: " + ex.Message);
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

        private void MainWebView_NavigationFailed(object sender, Windows.UI.Xaml.Navigation.WebViewNavigationFailedEventArgs e)
        {
            ShowFatalError("Falha ao navegar para o conteúdo local: " + e.WebErrorStatus);
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
