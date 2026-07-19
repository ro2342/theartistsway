using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ArtistWayUWP.Models;
using Windows.Data.Xml.Dom;
using Windows.UI.Notifications;

namespace ArtistWayUWP.Services
{
    // Atualiza a Live Tile e o badge do app — sem servidor de push (ver
    // sincronizacao-nuvem-setup.md, não existe backend próprio além do
    // Firestore usado direto pelo cliente): a tile só reflete o estado de
    // quando o app foi aberto/retomado por último, atualizada em
    // App.xaml.cs (OnLaunched/OnResuming), MainPage.CompleteOnboarding e
    // HomePage ao marcar Morning Pages — suficiente pra um app que abre
    // pelo menos uma vez por dia pra escrever as páginas.
    public static class TileService
    {
        public static async Task UpdateAsync()
        {
            try
            {
                ProfileSettings profile = await LocalDataStore.GetProfileAsync();
                if (profile == null || !profile.Onboarded)
                {
                    Clear();
                    return;
                }

                Dictionary<string, bool> allMp = await LocalDataStore.GetAllMorningPagesAsync();
                int streak = ComputeStreak(allMp, DateTime.Now.Date);
                int? dayCount = WeekCalculator.GetDayCount(profile);

                int weekId = WeekCalculator.GetWeekCursor(profile).WeekId;
                WeekContent week = ContentStore.Content.Weeks.FirstOrDefault(w => w.Id == weekId);
                int totalItems = week?.Checklist.Count ?? 0;
                HashSet<int> doneIndexes = await LocalDataStore.GetDoneChecklistIndexesAsync(weekId);
                int doneCount = doneIndexes.Count(idx => idx < totalItems);
                int pending = Math.Max(0, totalItems - doneCount);

                UpdateTile(streak, dayCount, pending);
                UpdateBadge(pending);
            }
            catch (Exception)
            {
                // Live Tile é só um espelho decorativo do estado local — uma
                // falha aqui (ex.: leitura de arquivo em andamento) nunca
                // pode derrubar o app em volta dela.
            }
        }

        // Conta os dias seguidos com Morning Pages marcadas, terminando
        // hoje (se já feita) ou ontem (se hoje ainda não foi — não
        // penaliza quem ainda não escreveu no dia corrente).
        private static int ComputeStreak(Dictionary<string, bool> allMp, DateTime today)
        {
            DateTime cursor = today;
            bool doneToday = allMp.TryGetValue(WeekCalculator.DateToStr(today), out bool todayFlag) && todayFlag;
            if (!doneToday)
            {
                cursor = today.AddDays(-1);
            }

            int streak = 0;
            while (allMp.TryGetValue(WeekCalculator.DateToStr(cursor), out bool done) && done)
            {
                streak++;
                cursor = cursor.AddDays(-1);
            }
            return streak;
        }

        private static void UpdateTile(int streak, int? dayCount, int pending)
        {
            string streakLine = streak > 0
                ? $"{streak} dia{(streak == 1 ? "" : "s")} seguidos"
                : "Comece hoje";
            string dayLine = dayCount.HasValue
                ? $"Dia {Math.Max(1, dayCount.Value)} de {WeekCalculator.ProgramLengthDays}"
                : "";
            string pendingLine = pending > 0
                ? $"{pending} pendente{(pending == 1 ? "" : "s")} essa semana"
                : "Semana em dia";

            // Todo texto aqui vem de frases fixas + números calculados
            // localmente (nunca nome/ideia digitados pelo usuário), então
            // não carrega caractere que precise de escape XML.
            string xml =
                "<tile>" +
                "<visual>" +
                "<binding template='TileMedium' branding='none'>" +
                "<text hint-style='captionSubtle'>Morning Pages</text>" +
                $"<text hint-style='titleNumeral'>{streak}</text>" +
                $"<text hint-style='captionSubtle'>{streakLine}</text>" +
                "</binding>" +
                "<binding template='TileWide' branding='none'>" +
                "<text hint-style='captionSubtle'>The Artist's Way</text>" +
                $"<text hint-style='title'>{streakLine}</text>" +
                $"<text hint-style='captionSubtle'>{dayLine}</text>" +
                $"<text hint-style='captionSubtle'>{pendingLine}</text>" +
                "</binding>" +
                "</visual>" +
                "</tile>";

            XmlDocument doc = new XmlDocument();
            doc.LoadXml(xml);
            TileUpdateManager.CreateTileUpdaterForApplication().Update(new TileNotification(doc));
        }

        private static void UpdateBadge(int pending)
        {
            BadgeUpdater badgeUpdater = BadgeUpdateManager.CreateBadgeUpdaterForApplication();
            if (pending <= 0)
            {
                badgeUpdater.Clear();
                return;
            }

            XmlDocument badgeXml = BadgeUpdateManager.GetTemplateContent(BadgeTemplateType.BadgeNumber);
            badgeXml.SelectSingleNode("/badge").Attributes.GetNamedItem("value").NodeValue = pending.ToString();
            badgeUpdater.Update(new BadgeNotification(badgeXml));
        }

        private static void Clear()
        {
            TileUpdateManager.CreateTileUpdaterForApplication().Clear();
            BadgeUpdateManager.CreateBadgeUpdaterForApplication().Clear();
        }
    }
}
