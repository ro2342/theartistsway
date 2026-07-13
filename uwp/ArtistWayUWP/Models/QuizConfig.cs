using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    // Espelha uma entrada de QUIZ_CONFIGS em www/js/data.js — gerado por
    // scripts/generate-content-json.js, carregado via
    // ContentStore.Content.QuizConfigs.
    public sealed class QuizConfig
    {
        public string Key { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public List<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
        public List<QuizBand> Bands { get; set; } = new List<QuizBand>();
    }

    public sealed class QuizQuestion
    {
        public string Text { get; set; }
        public List<QuizOption> Options { get; set; } = new List<QuizOption>();
    }

    public sealed class QuizOption
    {
        public string Label { get; set; }
        public double Value { get; set; }
    }

    public sealed class QuizBand
    {
        public double Min { get; set; }
        public double Max { get; set; }
        public string Label { get; set; }
        public string Description { get; set; }
    }
}
