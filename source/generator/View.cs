using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json.Serialization;
using System.Text.Json;
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
                    where prop.PropertyType.IsValueType || prop.PropertyType == typeof(string)
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

[JsonConverter(typeof(TopicConverter<Topic>))]
record Topic
{
    public string? Title { get; set; }
    public string? Text { get; set; }
}

sealed class TopicConverter<T> : JsonConverter<T> where T : Topic, new()
{
    public override T? Read(ref Utf8JsonReader reader, Type _, JsonSerializerOptions options)
    {
        string? title = null, text = null;
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                title = reader.GetString();
                break;

            case JsonTokenType.StartArray:
                reader.Read();
                if (reader.TokenType is JsonTokenType.String)
                {
                    title = reader.GetString();
                    reader.Read();
                    if (reader.TokenType is JsonTokenType.String)
                        text = reader.GetString();
                }
                while (reader.TokenType != JsonTokenType.EndArray)
                    reader.Read();
                break;

            case JsonTokenType.StartObject:
                while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
                {
                    var isTitle = reader.ValueSpan.SequenceEqual("Title"u8);
                    reader.Read();
                    if (reader.TokenType is JsonTokenType.String)
                        if (isTitle)
                            title = reader.GetString();
                        else 
                            text = reader.GetString();
                }
                break;
        }
        return new() { Text = text, Title = title ?? throw new JsonException() };
    }

    public override void Write(Utf8JsonWriter w, T value, JsonSerializerOptions options)
    {
        w.WriteStartObject();
        w.WriteString("Title"u8, value.Title);
        if (value.Text is { } text)
            w.WriteString("Text"u8, value.Text);
        w.WriteEndObject();
    }
}