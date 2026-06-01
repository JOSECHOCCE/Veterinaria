using System.Threading.Tasks;

namespace Veterinaria.Application.Interfaces;

public interface ICorreoService
{
    Task EnviarCorreoAsync(string destinatario, string asunto, string cuerpo);
}
