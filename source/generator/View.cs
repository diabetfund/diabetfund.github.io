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

    public string Run(params object?[] models)
    {
        var result = template;
        foreach (var obj in models)
        {
            if (obj is string content)
                result = result.Replace("@content", content);

            else if (obj is not null)
                foreach (var (key, val) in exposes.GetOrAdd(obj.GetType(), PropertiesReader)(obj))
                    result = result.Replace(key, val is null ? "null" : val.ToString()!);
        }
        return result;
    }
}