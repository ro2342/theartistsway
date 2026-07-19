using System;
using ArtistWayUWP.Models;

namespace ArtistWayUWP.Services
{
    // Mesma lógica de semana/data que já existia em www/js/app.js
    // (getCurrentWeekId, weekKeyForOffset, startOfWeek, dateToStr).
    public static class WeekCalculator
    {
        public static DateTime StartOfWeek(DateTime d)
        {
            DateTime date = d.Date;
            return date.AddDays(-(int)date.DayOfWeek);
        }

        public static string DateToStr(DateTime d)
        {
            return d.ToString("yyyy-MM-dd");
        }

        // Início da semana corrente pra faixa de Morning Pages da Home,
        // ancorado no dia da semana escolhido em profile.StartDate (não
        // necessariamente domingo) — as Morning Pages podem começar em
        // qualquer dia, então a primeira bolinha da faixa tem que ser o
        // mesmo dia da semana marcado como início do programa nos
        // Ajustes/Meu Perfil, não um "últimos 7 dias" genérico.
        public static DateTime CurrentStreakWeekStart(ProfileSettings profile, DateTime today)
        {
            DayOfWeek startDow = DayOfWeek.Sunday;
            if (profile != null && !string.IsNullOrEmpty(profile.StartDate) &&
                DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                startDow = startDate.DayOfWeek;
            }
            int diff = ((int)today.DayOfWeek - (int)startDow + 7) % 7;
            return today.AddDays(-diff);
        }

        // Cálculo puramente por data — mesma conta de sempre, mas agora só
        // serve pra semear o cursor da semana na primeira vez (ver
        // LocalDataStore.GetOrSeedWeekCursorAsync). Não decide mais sozinho
        // a semana "atual" — isso passou a ser uma decisão explícita do
        // usuário (continuar na semana ou avançar), guardada em
        // ProfileSettings.WeekCursor.
        public static int NaturalWeekId(ProfileSettings profile)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return 1;
            }
            DateTime start = StartOfWeek(startDate);
            DateTime now = StartOfWeek(DateTime.Now);
            int diffWeeks = (int)Math.Round((now - start).TotalDays / 7.0);
            return Math.Min(12, Math.Max(1, diffWeeks + 1));
        }

        // Fallback puro (sem gravar nada) pra quem só precisa ler a semana
        // atual sem se importar em persistir um cursor recém-semeado (ex.:
        // TileService). Se o perfil já tem um cursor salvo, usa ele; senão
        // recalcula pela data, igual sempre foi.
        public static WeekCursor GetWeekCursor(ProfileSettings profile)
        {
            if (profile?.WeekCursor != null)
            {
                return profile.WeekCursor;
            }
            return new WeekCursor
            {
                WeekId = NaturalWeekId(profile),
                CycleStart = DateToStr(CurrentStreakWeekStart(profile, DateTime.Now)),
            };
        }

        // Os 7 dias do ciclo atual já passaram? Se sim, a Home mostra o
        // cartão de decisão (continuar na semana ou ir pra próxima) em vez
        // de trocar de semana sozinha.
        public static bool IsWeekCyclePending(WeekCursor cursor)
        {
            if (cursor == null || !DateTime.TryParse(cursor.CycleStart, out DateTime cycleStart))
            {
                return false;
            }
            return DateTime.Now >= cycleStart.AddDays(7);
        }

        public static string WeekKeyForOffset(ProfileSettings profile, int weekId)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return DateToStr(StartOfWeek(DateTime.Now));
            }
            DateTime start = StartOfWeek(startDate);
            DateTime weekStart = start.AddDays((weekId - 1) * 7);
            return DateToStr(weekStart);
        }

        public const int ProgramLengthDays = 84; // 12 semanas x 7 dias

        // Contador de dias (Home) — mesmo cálculo do PWA (dayCountSinceStart
        // em app.js), sem guardar nenhum dado novo.
        public static int? GetDayCount(ProfileSettings profile)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return null;
            }
            return (int)(DateTime.Now.Date - startDate.Date).TotalDays + 1;
        }

        public static bool IsProgramFinished(ProfileSettings profile)
        {
            int? dayCount = GetDayCount(profile);
            return dayCount.HasValue && dayCount.Value > ProgramLengthDays;
        }
    }
}
