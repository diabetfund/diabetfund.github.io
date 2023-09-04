using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using static System.Linq.Expressions.Expression;

interface ILocalized
{
    object? Locale(string lang);
}

public delegate string Printer(object? model, [CallerArgumentExpression("model")] string nameOrTemplate = "");

public sealed class PrinterFactory
{
    public static Printer Create(Func<string, string> readTemplate, string lang = "en")
    {
        ConcurrentDictionary<string, string> templates = [];

        string Render(object? box, string template) => box switch
        {
            null => template,
            string content => template.Replace("@content", content),

            IEnumerable<object> items => string.Join("\n", items.Select(it => Render(it, template))),

            ILocalized item => PrintModel(Render(item.Locale(lang), template), item),
            _ => PrintModel(template, box)
        };

        return (model, name) => Render(model,
                name.Length > 50 ? name : templates.GetOrAdd(
                    name.IndexOf('.') is > -1 and var i ? name[..i] : name,
                    (path, read) => read(path), readTemplate));
    }

    static string PrintModel(string result, object model)
    {
        var getScalars = scalarGetters.GetOrAdd(model.GetType(), type =>
            Lambda<Func<object, (string, object)[]>>(
                    NewArrayInit(typeof((string, object)),
                        from prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                        where prop.PropertyType.IsValueType || prop.PropertyType == typeof(string)
                        select New(tupleCtor,
                            Constant("@" + prop.Name),
                            Convert(Property(Convert(arg, type), prop), typeof(object)))),
                    arg)
                .Compile());

        foreach (var (key, val) in getScalars(model))
            result = result.Replace(key, val is null ? "null" : val.ToString());

        return result;
    }

    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> scalarGetters = [];

    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];

    static readonly ParameterExpression arg = Parameter(typeof(object));  
}