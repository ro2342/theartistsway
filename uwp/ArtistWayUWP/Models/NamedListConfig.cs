using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    public sealed class ListFieldConfig
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public bool Multiline { get; set; }
    }

    // Espelha uma entrada de TOOL_CONFIGS em www/js/data.js — gerado por
    // scripts/generate-content-json.js dentro de Data/content.json e
    // carregado via ContentStore.Content.ToolConfigs. "Singleton" marca um
    // formulário de um registro só (editável/sobrescrito, ver
    // NamedListPage.xaml.cs) em vez de uma lista que só cresce.
    public sealed class NamedListConfig
    {
        public string ListName { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public bool Singleton { get; set; }
        public List<ListFieldConfig> Fields { get; set; } = new List<ListFieldConfig>();
    }
}
