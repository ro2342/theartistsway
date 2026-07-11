using System;
using System.Threading.Tasks;
using Windows.ApplicationModel.Appointments;
using Windows.Foundation;

namespace ArtistWayUWP.Services
{
    // Alternativa nativa ao link do Google Calendar: adiciona o compromisso
    // recorrente direto no app de Calendário do próprio Windows via
    // AppointmentManager.ShowAddAppointmentAsync -- é um fluxo de composição
    // mediado pelo sistema (o usuário confirma antes de salvar), por isso
    // não precisa declarar a capability "appointments" no manifesto (essa só
    // é exigida pra leitura/escrita silenciosa via AppointmentStore).
    public static class AppointmentService
    {
        public static async Task<bool> AddDailyAsync(string subject, string details, TimeSpan time, int durationMinutes)
        {
            DateTime start = DateTime.Today.Add(time);
            if (start <= DateTime.Now)
            {
                start = start.AddDays(1);
            }

            Appointment appointment = new Appointment
            {
                Subject = subject,
                Details = details,
                StartTime = start,
                Duration = TimeSpan.FromMinutes(durationMinutes),
                Recurrence = new AppointmentRecurrence
                {
                    Unit = AppointmentRecurrenceUnit.Daily,
                    Interval = 1,
                },
            };

            string id = await AppointmentManager.ShowAddAppointmentAsync(appointment, new Rect());
            return !string.IsNullOrEmpty(id);
        }

        public static async Task<bool> AddWeeklyAsync(string subject, string details, int weekdayIndex, TimeSpan time, int durationMinutes)
        {
            DateTime start = NextOccurrence(weekdayIndex, time);

            Appointment appointment = new Appointment
            {
                Subject = subject,
                Details = details,
                StartTime = start,
                Duration = TimeSpan.FromMinutes(durationMinutes),
                Recurrence = new AppointmentRecurrence
                {
                    Unit = AppointmentRecurrenceUnit.Weekly,
                    Interval = 1,
                    DaysOfWeek = ToDaysOfWeek(start.DayOfWeek),
                },
            };

            string id = await AppointmentManager.ShowAddAppointmentAsync(appointment, new Rect());
            return !string.IsNullOrEmpty(id);
        }

        // weekdayIndex: 1=domingo..7=sábado, mesma convenção do resto do app.
        private static DateTime NextOccurrence(int weekdayIndex, TimeSpan time)
        {
            DateTime now = DateTime.Now;
            DateTime candidate = DateTime.Today.Add(time);
            int targetDow = weekdayIndex - 1;
            int diff = (targetDow - (int)candidate.DayOfWeek + 7) % 7;
            if (diff == 0 && candidate <= now)
            {
                diff = 7;
            }
            return candidate.AddDays(diff);
        }

        private static DaysOfWeek ToDaysOfWeek(DayOfWeek day)
        {
            switch (day)
            {
                case DayOfWeek.Sunday: return DaysOfWeek.Sunday;
                case DayOfWeek.Monday: return DaysOfWeek.Monday;
                case DayOfWeek.Tuesday: return DaysOfWeek.Tuesday;
                case DayOfWeek.Wednesday: return DaysOfWeek.Wednesday;
                case DayOfWeek.Thursday: return DaysOfWeek.Thursday;
                case DayOfWeek.Friday: return DaysOfWeek.Friday;
                default: return DaysOfWeek.Saturday;
            }
        }
    }
}
