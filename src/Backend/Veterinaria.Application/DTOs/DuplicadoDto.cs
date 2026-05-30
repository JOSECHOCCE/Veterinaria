using System;

namespace Veterinaria.Application.DTOs;

public class DuplicadoDto
{
    public string Tipo { get; set; } = string.Empty; // "DNI", "Telefono", "Email"
    public string Valor { get; set; } = string.Empty;
    public int ClienteExistenteId { get; set; }
    public string ClienteExistenteNombre { get; set; } = string.Empty;
}
