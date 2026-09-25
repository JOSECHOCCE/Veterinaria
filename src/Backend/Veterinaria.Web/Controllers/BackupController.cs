using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly IDatabaseBackupService _backupService;

    public BackupController(IDatabaseBackupService backupService)
    {
        _backupService = backupService;
    }

    [HttpGet]
    public ActionResult<Response<IEnumerable<BackupFileInfo>>> ListBackups()
    {
        var backups = _backupService.ListBackups();
        return Ok(Response<IEnumerable<BackupFileInfo>>.Ok(backups, "Respaldos recuperados con éxito."));
    }

    [HttpPost("trigger")]
    public async Task<ActionResult<Response<string>>> TriggerBackup()
    {
        var filename = await _backupService.CreateBackupAsync();
        return Ok(Response<string>.Ok(filename, "Respaldo de base de datos generado con éxito."));
    }

    [HttpGet("download/{filename}")]
    public IActionResult DownloadBackup(string filename)
    {
        // Path traversal protection
        var safeFileName = Path.GetFileName(filename);
        if (string.IsNullOrWhiteSpace(safeFileName) || safeFileName != filename)
        {
            return BadRequest(Response<string>.Fail("Nombre de archivo inválido."));
        }

        var backupDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "backups");
        var filePath = Path.Combine(backupDir, safeFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(Response<string>.Fail("El archivo de respaldo solicitado no existe."));
        }

        var bytes = System.IO.File.ReadAllBytes(filePath);
        return File(bytes, "application/octet-stream", safeFileName);
    }
}
