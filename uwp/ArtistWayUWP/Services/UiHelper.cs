using Windows.Foundation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;

namespace ArtistWayUWP.Services
{
    public static class UiHelper
    {
        // Retângulo do elemento na tela, relativo à janela do app -- usado
        // como âncora pra APIs de composição do sistema (ex.:
        // AppointmentManager.ShowAddAppointmentAsync), que documentam
        // esperar o retângulo de quem disparou a ação, não um Rect vazio.
        public static Rect GetElementRect(FrameworkElement element)
        {
            GeneralTransform transform = element.TransformToVisual(null);
            Point origin = transform.TransformPoint(new Point(0, 0));
            return new Rect(origin, new Size(element.ActualWidth, element.ActualHeight));
        }
    }
}
