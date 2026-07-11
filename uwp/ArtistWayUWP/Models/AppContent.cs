using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    // Espelha o conteúdo de www/js/data.js -- gerado uma vez para
    // Data/content.json por um script Node descartável (ver uwp/README.md),
    // não editado à mão. Se o conteúdo do livro mudar, regenerar o JSON em
    // vez de editar os dois lados separadamente.
    public sealed class AppContent
    {
        public List<WeekContent> Weeks { get; set; } = new List<WeekContent>();
        public List<string> CheckinCoreQuestions { get; set; } = new List<string>();
        public List<string> ArtistDateIdeas { get; set; } = new List<string>();
        public List<string> RoadRules { get; set; } = new List<string>();
        public List<string> BasicPrinciples { get; set; } = new List<string>();
    }
}
