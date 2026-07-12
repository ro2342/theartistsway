using System;
using Windows.UI.Xaml;

namespace ArtistWayUWP.Services
{
    // Agenda uma sincronização ~5s depois da última mudança local -- espera
    // a "rajada" de toques parar antes de gastar uma chamada de rede (ver
    // "Decisões de arquitetura" em sincronizacao-nuvem-setup.md). Chamado
    // pelos métodos do LocalDataStore que gravam dado do usuário. Não faz
    // nada se ninguém estiver logado.
    public static class SyncScheduler
    {
        private static DispatcherTimer _timer;

        public static void ScheduleSync()
        {
            if (SessionService.GetSession() == null)
            {
                return;
            }

            if (_timer == null)
            {
                _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(5) };
                _timer.Tick += async (s, e) =>
                {
                    _timer.Stop();
                    await SyncService.SyncAllAsync();
                };
            }

            _timer.Stop();
            _timer.Start();
        }
    }
}
