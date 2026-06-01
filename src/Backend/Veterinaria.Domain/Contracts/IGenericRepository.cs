namespace Veterinaria.Domain.Contracts;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    IQueryable<T> GetAll();
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
}
