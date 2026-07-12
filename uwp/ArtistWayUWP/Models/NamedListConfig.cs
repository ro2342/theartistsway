using System;
using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    public sealed class ListFieldConfig
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public bool Multiline { get; set; }
    }

    public sealed class NamedListConfig
    {
        public string ListName { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public List<ListFieldConfig> Fields { get; set; } = new List<ListFieldConfig>();
    }

    // Configuração de cada lista simples que reaproveita NamedListPage --
    // Vidas Imaginárias, 20 Coisas que Gosto de Fazer e Mapa do Ciúme.
    // Círculo de Segurança não entra aqui porque a tela dele é diferente
    // (duas colunas + alternar lado, não um formulário de adicionar).
    public static class NamedListConfigs
    {
        public static NamedListConfig Get(string key)
        {
            switch (key)
            {
                case "imaginaryLives":
                    return new NamedListConfig
                    {
                        ListName = "imaginaryLives",
                        Title = "Vidas Imaginárias",
                        Subtitle = "Vidas que você gostaria de ter vivido -- a lista cresce a cada semana, não precisa reescrever do zero.",
                        Fields = new List<ListFieldConfig>
                        {
                            new ListFieldConfig { Key = "text", Label = "Uma vida imaginária", Multiline = true },
                        },
                    };
                case "thingsILike":
                    return new NamedListConfig
                    {
                        ListName = "thingsILike",
                        Title = "20 Coisas que Gosto de Fazer",
                        Subtitle = "Uma lista viva -- reaparece em vários exercícios do livro, inclusive como banco de ideias pra Artist Date.",
                        Fields = new List<ListFieldConfig>
                        {
                            new ListFieldConfig { Key = "text", Label = "Uma coisa que eu gosto de fazer", Multiline = false },
                        },
                    };
                case "jealousyMap":
                    return new NamedListConfig
                    {
                        ListName = "jealousyMap",
                        Title = "Mapa do Ciúme",
                        Subtitle = "Quem você sente inveja, por quê, e uma ação-antídoto pra cada um.",
                        Fields = new List<ListFieldConfig>
                        {
                            new ListFieldConfig { Key = "who", Label = "Quem", Multiline = false },
                            new ListFieldConfig { Key = "why", Label = "Por quê", Multiline = true },
                            new ListFieldConfig { Key = "antidote", Label = "Ação-antídoto", Multiline = true },
                        },
                    };
                default:
                    throw new ArgumentException("Configuração de lista desconhecida: " + key);
            }
        }
    }
}
