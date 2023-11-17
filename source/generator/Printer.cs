using System.Collections.Concurrent;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using static System.Linq.Expressions.Expression;

public interface ILocalized
{
    object? GetLocalized(CultureInfo? culture);
}

public sealed class Printer(Func<string, string> readTemplate, CultureInfo? culture = null)
{
    readonly ConcurrentDictionary<string, string> templates = [];

    public string this[object? model, [CallerArgumentExpression("model")] string nameOrTemplate = ""] =>
        Render(model,
            nameOrTemplate.Length > 50 ? nameOrTemplate : templates.GetOrAdd(
            nameOrTemplate.IndexOf('.') is > -1 and var i ? nameOrTemplate[..i] : nameOrTemplate,
            (path, read) => read(path), readTemplate));

    string Render(object? box, string template) =>
        box switch
        {
            null => template,
            string content => template.Replace("@content", content),

            IEnumerable<object> items => string.Join("\n", items.Select(it => Render(it, template))),

            ILocalized item => PrintModel(Render(item.GetLocalized(culture), template), item),

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
                        Convert(Property(Convert(modelParameter, type), prop), typeof(object)))),
                modelParameter)
            .Compile());

        foreach (var (key, val) in getScalars(model))
            result = result.Replace(key, val is null ? "null" : val.ToString());

        return result;
    }

    static readonly ConcurrentDictionary<Type, Func<object, (string, object)[]>> scalarGetters = [];

    static readonly ConstructorInfo tupleCtor = typeof((string, object)).GetConstructors()[0];

    static readonly ParameterExpression modelParameter = Parameter(typeof(object));
}