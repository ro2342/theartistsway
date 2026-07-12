using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    // Um item genérico de "lista nomeada" -- usado por Vidas Imaginárias,
    // 20 Coisas que Gosto de Fazer, Mapa do Ciúme, Círculo de Segurança e
    // Life Pie. Fields fica solto (não uma classe por funcionalidade) de
    // propósito: cada tela sabe quais chaves ler/escrever, e o mecanismo
    // de guardar/sincronizar não precisa mudar quando uma tela nova é
    // adicionada. Life Pie usa chaves "ratings.<categoria>" dentro do
    // mesmo dicionário em vez de um objeto aninhado à parte.
    public sealed class NamedListItem
    {
        public string Id { get; set; }
        public Dictionary<string, string> Fields { get; set; } = new Dictionary<string, string>();
        public string UpdatedAt { get; set; }
    }
}
