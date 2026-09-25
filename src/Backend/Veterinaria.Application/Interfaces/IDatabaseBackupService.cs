using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Veterinaria.Application.Interfaces;

public record BackupFileInfo(string FileName, long SizeBytes, DateTime CreatedAt);

public interface IDatabaseBackupService
{
    Task<string> CreateBackupAsync(CancellationToken cancellationToken = default);
    Task PurgeOldBackupsAsync(int retentionDays = 30, CancellationToken cancellationToken = default);
    IEnumerable<BackupFileInfo> ListBackups();
}
