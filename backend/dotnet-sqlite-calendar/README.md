
# Bryntum Calendar ASP.NET Core API

A basic ASP.NET Core API for performing CRUD operations on a SQLite database. For use with a Bryntum Calendar front end.

## Install the .NET SDK using the C# Dev Kit VS Code extension

Open VS Code and install the [C# Dev Kit VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit). This will also install the [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) and [.NET Install Tool](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.vscode-dotnet-runtime) extensions.

The C# Dev Kit VS Code extension will activate when you open a folder or workspace that contains a C# project such as this one. 

Do the first two get-started steps in the extension's welcome page:

- Connect your Microsoft account
- Install the .NET SDK

## Install dependencies

Run the following command to install the project dependencies:

```bash
dotnet restore
```

## Install SQLite

If you use macOS, install SQLite using [Homebrew](https://brew.sh/):

```sh
brew install sqlite
```

For installation instructions on other operating systems, see the [SQLite downloads page](https://sqlite.org/download.html).  

## Seed the database

Run the following command to create the SQLite database and populate it with example data:

```bash
dotnet run -- --seed
```

This will create a `calendar.sqlite3` file in the project directory with the events and resources data.

## Run the API server

Run the .NET server:

```bash
dotnet run
```

The server will start on `http://localhost:1337`.

## API endpoints

### Load data

```
GET http://localhost:1337/api/load
```

Returns all events and resources.

### Sync data

```
POST http://localhost:1337/api/sync
```

Syncs changes (added, updated, removed) for events and resources.
