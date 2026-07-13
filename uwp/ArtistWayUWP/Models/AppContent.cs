using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    // Espelha o conteúdo de www/js/data.js — gerado por
    // scripts/generate-content-json.js (não editado à mão; o workflow
    // 02-build-appx.yml falha o build se esquecerem de regenerar depois
    // de mudar data.js).
    public sealed class AppContent
    {
        public List<WeekContent> Weeks { get; set; } = new List<WeekContent>();
        public List<string> CheckinCoreQuestions { get; set; } = new List<string>();
        public List<string> ArtistDateIdeas { get; set; } = new List<string>();
        public List<string> RoadRules { get; set; } = new List<string>();
        public List<string> BasicPrinciples { get; set; } = new List<string>();
        public List<BeliefPair> BeliefTable { get; set; } = new List<BeliefPair>();
        public List<string> Affirmations { get; set; } = new List<string>();
        public Dictionary<string, string> UiStrings { get; set; } = new Dictionary<string, string>();
        public List<NamedListConfig> ToolConfigs { get; set; } = new List<NamedListConfig>();
        public List<QuizConfig> QuizConfigs { get; set; } = new List<QuizConfig>();
    }

    public sealed class BeliefPair
    {
        public string Negative { get; set; }
        public string Positive { get; set; }
    }
}
