using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;

namespace Veterinaria.Infrastructure.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    private readonly DbContext _context;
    private readonly DbSet<T> _set;

    public GenericRepository(DbContext context)
    {
        _context = context;
        _set = _context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _set.FindAsync(id);
    }

    public IQueryable<T> GetAll()
    {
        return _set.AsNoTracking().AsQueryable();
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _set.AsNoTracking().ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _set.AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _set.AddRangeAsync(entities);
    }

    public void Update(T entity)
    {
        _set.Update(entity);
    }

    public void Remove(T entity)
    {
        _set.Remove(entity);
    }

    public void RemoveRange(IEnumerable<T> entities)
    {
        _set.RemoveRange(entities);
    }
}
