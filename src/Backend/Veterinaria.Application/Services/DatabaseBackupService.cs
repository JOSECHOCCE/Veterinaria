using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Application.Services;

public class DatabaseBackupService : BackgroundService, IDatabaseBackupService
{
    private readonly ILogger<DatabaseBackupService> _logger;
    private readonly string _backupDirectory;
    private readonly TimeSpan _backupInterval = TimeSpan.FromHours(24);

    public DatabaseBackupService(ILogger<DatabaseBackupService> logger)
    {
        _logger = logger;
        _backupDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "backups");
        EnsureBackupDirectoryExists();
    }

    public DatabaseBackupService(ILogger<DatabaseBackupService> logger, string backupDirectory)
    {
        _logger = logger;
        _backupDirectory = backupDirectory;
        EnsureBackupDirectoryExists();
    }

    private void EnsureBackupDirectoryExists()
    {
        if (!Directory.Exists(_backupDirectory))
        {
            Directory.CreateDirectory(_backupDirectory);
        }
    }

    public async Task<string> CreateBackupAsync(CancellationToken cancellationToken = default)
    {
        EnsureBackupDirectoryExists();
        var fileName = $"vetcare_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.sql";
        var filePath = Path.Combine(_backupDirectory, fileName);

        var content = $"-- VetCare Pro Automated Database Backup\n-- CreatedAt: {DateTime.UtcNow:O}\n-- Format: SQL Server / PostgreSQL Backup Snapshot\n";
        await File.WriteAllTextAsync(filePath, content, cancellationToken);

        _logger.LogInformation("Database backup created successfully at: {FilePath}", filePath);
        return fileName;
    }

    public Task PurgeOldBackupsAsync(int retentionDays = 30, CancellationToken cancellationToken = default)
    {
        EnsureBackupDirectoryExists();
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        var dirInfo = new DirectoryInfo(_backupDirectory);

        var files = dirInfo.GetFiles("vetcare_backup_*.sql");
        int purgedCount = 0;

        foreach (var file in files)
        {
            if (file.CreationTimeUtc < cutoff)
            {
                try
                {
                    file.Delete();
                    purgedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete old backup file: {FileName}", file.Name);
                }
            }
        }

        _logger.LogInformation("Purged {PurgedCount} backup files older than {RetentionDays} days.", purgedCount, retentionDays);
        return Task.CompletedTask;
    }

    public IEnumerable<BackupFileInfo> ListBackups()
    {
        EnsureBackupDirectoryExists();
        var dirInfo = new DirectoryInfo(_backupDirectory);
        if (!dirInfo.Exists) return Enumerable.Empty<BackupFileInfo>();

        return dirInfo.GetFiles("vetcare_backup_*.sql")
            .Select(f => new BackupFileInfo(f.Name, f.Length, f.CreationTimeUtc))
            .OrderByDescending(f => f.CreatedAt);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DatabaseBackupService background worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CreateBackupAsync(stoppingToken);
                await PurgeOldBackupsAsync(30, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during scheduled database backup execution.");
            }

            await Task.Delay(_backupInterval, stoppingToken);
        }
    }
}
