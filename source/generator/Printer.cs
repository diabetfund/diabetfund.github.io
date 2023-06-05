using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using static System.Linq.Expressions.Expression;

interface ILocalized
{
    object? Locale(string lang);
}

sealed class Printer(Func<string, string> readTemplate, string lang = "en")
{
    readonly ConcurrentDictionary<string, string> templates = new();

    public string this[object? model, [CallerArgumentExpression(nameof(model))] string pathOrTemplate = ""]
    {
        get
        {
            if (pathOrTemplate.Length < 50)
            {
                if (pathOrTemplate.IndexOf('.') is > -1 and var index)
                    pathOrTemplate = pathOrTemplate[..index];

                pathOrTemplate = templates.GetOrAdd(pathOrTemplate, (path, read) => read(path), readTemplate);
            }
            return Print(model, pathOrTemplate);
        }
    }

    string Print(object? box, string template) =>
        box switch
        {
            null => template,

            string content => template.Replace("@content", content),
            
            IEnumerable<object> items => string.Join("\n", items.Select(it => Print(it, template))),

            ILocalized item => PrintModel(Print(item.Locale(lang), template), item),

            _ => PrintModel(template, box)
        };

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

    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> scalarGetters = new();
    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];
    static readonly ParameterExpression arg = Parameter(typeof(object));  
}