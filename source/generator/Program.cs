using System.Text.Json;

var version = 34;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

Item<P, L>[] ReadJ<P, L>(string table) where P : Props =>
    JsonSerializer.Deserialize<Item<P, L>[]>(File.ReadAllText($"{rootPath}source/{table}.json"))!;

var (projects, news, partners, thanks, slides_) = 
    (ReadJ<Proj, PayLoc>("projects"), ReadJ<News, Locale>("news"), ReadJ<Props, Locale>("partners"),
     ReadJ<Thanks, Locale>("thanks"), ReadJ<Slide, PayLoc>("slides"));

Render("ua");
Render("en");

void Render(string lang)
{
    string Read(string path)
    {
        var full = $"{rootPath}source/{path}.html";
        return File.ReadAllText(File.Exists(full) ? full : $"{rootPath}source/{lang}/{path}.html");
    }
    FastView View(string path) => new(Read(path));

    string Join<P, L>(FastView view, IEnumerable<Item<P, L>> xs) =>
        string.Join("\n", xs.Select(e => view.Run(e.Props, lang is "en" ? e.En : e.Ua)));

    (P, string, string) Card<P, L>(Item<P, L> it, FastView view, string cardsParth) =>
        (it.Props, Read(cardsParth + (it.Props as Props)!.Id!), view.Run(it.Props, lang is "en" ? it.En : it.Ua));

    FastView master = View("master"), thank = View("thankCard"),
        newsCard = View("newsCard"), newsPage = View("newsPage"),
        projPage = View("projPage"), projCard = View("projectCard");

    string slides = Join(View("slide"), slides_),
        payDetails = Read("partners-pay"),
        otherNews = Join(newsCard, news.Take(2)),

        topThanks = Join(View("thankCardMain"), thanks.Take(4).Select((t, i) => t with { Props = t.Props with { DesctopOnly = i == 3 } })),
        
        topProjects = Join(projCard, projects.Take(6).Select((p, i) => p with { Props = p.Props with { DesctopOnly = i > 3 } }));

    void Out(string content, string subPath, object? arg = null)
    {
        if (content.Length < 30)
            content = Read(content);
        if (arg is not null)
            content = new FastView(content).Run(arg);

        var path = $"{rootPath}/{lang}{subPath}/index.html";
        
        new FileInfo(path).Directory!.Create();
        File.WriteAllText(path, master.Run(new { content, subPath, version, lang }));
    }

    var founders = View("founders").Run(Join(View("partner"), partners));
    Out("index", "", new { topProjects, payDetails, slides, topThanks });
    Out("center", "/center", new { payDetails, founders, skipAbout = true });
    Out("aboutus", "/aboutus", new { payDetails, founders });

    Out("thanks", "/thanks", Join(thank, thanks));

    foreach (var page in "about-diabetes contacts founding-documents fun".Split(' '))
        Out(page, "/" + page);

    Out("projects", "/fundraising", Join(projCard, projects));

    foreach (var (props, content, view) in projects.Select(p => Card(p, projPage, "projects/")))
        if (content.Split("@projDoc") is [var contentF, var contentS])
            Out(view, "/fundraising/" + props.Id, new 
            {
                contentF, contentS,
                report = props.ReportId is { } rep ? Read("projects/" + rep) : null
            });

    Out("news", "/news", Join(newsCard, news));

    foreach (var (props, content, view) in news.Select(n => Card(n, newsPage, "news/")))
        Out(view, "/news/"+props.Id, new { content, otherNews });
}

record Props
{
    public string? Id { get; set; }
    public string? Pic { get; set; }
    public string? MiniPic { get; set; }
    public bool DesctopOnly { get; set; }
}

record Locale
{
    public required string Title { get; set; }
    public string? Descr { get; set; }
}

record Item<TProps, TLoc>(TProps Props, TLoc En, TLoc Ua);

record News(string Date) : Props;

record PayLoc(string? Data, string? Signature): Locale;

record Proj(int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf) : Props
{
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };
    public bool IsFull => Need == Funds;
    public string Url => Uri(Id!);

    public static string Uri(string id) => id is "help-rehab" ? "center" : $"fundraising/{id}";
}

record Thanks(int? HRank = null) : Props;

record Slide(string ProjectId, int DarkPerc) : Props
{
    public string Url => Proj.Uri(ProjectId);
}
