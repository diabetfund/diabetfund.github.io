using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using static System.Linq.Expressions.Expression;

readonly struct View(string template)
{
    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> exposes = new();
    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];
    static readonly ParameterExpression arg = Parameter(typeof(object));

    public string Run(params object?[] models) =>
        models.SelectMany(model =>
            model is string ? new[] { ("@content", model) }
            : exposes.GetOrAdd(model!.GetType(), type =>
                Lambda<Func<object, (string, object)[]>>(
                    NewArrayInit(typeof((string, object)),
                        from prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                        select New(tupleCtor,
                            Constant("@" + prop.Name),
                            Convert(Property(Convert(arg, type), prop), typeof(object)))),
                    arg)
                .Compile()
               )(model))
        .Aggregate(template, (acc, val) => acc.Replace(val.Item1, val.Item2?.ToString() ?? "null"));
}