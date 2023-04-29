using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using static System.Linq.Expressions.Expression;

readonly struct View(string template)
{
    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> exposes = new();
    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];
    static readonly ParameterExpression arg = Parameter(typeof(object));

    static Func<object, (string, object)[]> PropertiesReader(Type type) =>
        Lambda<Func<object, (string, object)[]>>(
            NewArrayInit(typeof((string, object)),
                from prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                select New(tupleCtor,
                        Constant("@" + prop.Name),
                        Convert(Property(Convert(arg, type), prop), typeof(object)))),
                arg)
            .Compile();
    
    public string T => template;

    static IEnumerable<(string, string)> ScalarProperties(object? obj) 
    {
        if (obj is string content)
            yield return ("@content", content);

        else if (obj is { })
            foreach (var (key, val) in exposes.GetOrAdd(obj.GetType(), PropertiesReader)(obj))
                yield return (key, val == null ? "null" : val.ToString()!);
    }

    public string Run(params object?[] models) =>
        models.SelectMany(ScalarProperties).Aggregate(template, (acc, val) =>
            acc.Replace(val.Item1, val.Item2));
}