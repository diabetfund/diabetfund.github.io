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
        models.SelectMany(model => exposes.GetOrAdd(model.GetType(), static type =>
            Lambda<Func<object, (string, object)[]>>(
                NewArrayInit(typeof((string, object)),
                    from prop in type.GetProperties()
                    where Type.GetTypeCode(prop.PropertyType) is not TypeCode.Object
                    select New(tupleCtor,
                        Constant(prop.Name),
                        Convert(Property(Convert(arg, type), prop), typeof(object)))),
                arg)
            .Compile()
        )(model))
        .Aggregate(Template, (t, kv) => t.Replace("{{" + kv.Item1 + "}}", kv.Item2?.ToString() ?? "null"));
}