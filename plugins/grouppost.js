HttpClient client = HttpClient.newHttpClient();

String json = """
{
  "path": "status.jpg",
  "caption": "🔥 New update!"
}
""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("http://localhost:3000/status/image"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

client.send(request, HttpResponse.BodyHandlers.ofString());
