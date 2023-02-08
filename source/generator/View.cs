using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using static System.Linq.Expressions.Expression;

record View(string Template)
{
    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> exposes = new();
    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];
    static readonly ParameterExpression arg = Parameter(typeof(object));
    
    public string Run(params object[] models) =>
        models.SelectMany(model =>
            model is string ? new[] { ("content", model) }
            : exposes.GetOrAdd(model.GetType(), static type =>
                Lambda<Func<object, (string, object)[]>>(
                    NewArrayInit(typeof((string, object)),
                        from prop in type.GetProperties()
                        select New(tupleCtor,
                            Constant(prop.Name),
                            Convert(Property(Convert(arg, type), prop), typeof(object)))),
                    arg)
                .Compile()
               )(model))
        .Aggregate(Template, (t, p) => t.Replace("@"+p.Item1, p.Item2?.ToString() ?? "null"));
}