import requests
import os
import time
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

load_dotenv()
GITHUB_TOKEN = os.getenv("GIT_AUTH_TOKEN")
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
MAX_CONCURRENT_REQUESTS = 5
DELAY_BETWEEN_REQUESTS = 1
TARGET_VALID_REPOS = 200
PR_FETCH_LIMIT = 80

def get_info(query, variables={}, retries=1):
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    try:
        response = requests.post(
            GITHUB_GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:
            return response.json()
        else:
            print(f"⚠️ Erro {response.status_code} ao buscar dados: {response.text[:100]}")
    except Exception as e:
        print(f"🚫 Erro na requisição: {e}")
    return None

QUERY_REPOSITORIES = """
query ($cursor: String) {
  search(query: "stars:>10000", type: REPOSITORY, first: 50, after: $cursor) {
    edges {
      node {
        ... on Repository {
          name
          owner {
            login
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
"""

QUERY_PULL_REQUESTS_TEMPLATE = """
query($owner: String!, $name: String!, $limit: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: [MERGED, CLOSED], first: $limit, orderBy: {field: CREATED_AT, direction: DESC}) {
      edges {
        node {
          title
          createdAt
          mergedAt
          closedAt
          body
          reviews(first: 10) {
            edges {
              node {
                createdAt
              }
            }
          }
          changedFiles
          additions
          deletions
          participants(first: 100) {
            totalCount
          }
          comments(first: 100) {
            totalCount
          }
        }
      }
    }
  }
}
"""

QUERY_PR_COUNT = """
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: [MERGED, CLOSED]) {
      totalCount
    }
  }
}
"""

def has_minimum_prs(owner, name, min_count=100):
    data = get_info(QUERY_PR_COUNT, {"owner": owner, "name": name})
    try:
        return data and data["data"]["repository"]["pullRequests"]["totalCount"] >= min_count
    except:
        return False

def get_top_repositories():
    cursor = None
    while True:
        data = get_info(QUERY_REPOSITORIES, {"cursor": cursor})
        if not data:
            break

        for repo in data["data"]["search"]["edges"]:
            yield repo

        page_info = data["data"]["search"]["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        cursor = page_info["endCursor"]
        time.sleep(DELAY_BETWEEN_REQUESTS)

def review_time_valid(pr_node):
    created_at = datetime.fromisoformat(pr_node["createdAt"].replace("Z", "+00:00"))
    reviews = pr_node["reviews"]["edges"]
    if not reviews:
        return False
    first_review_time = datetime.fromisoformat(reviews[0]["node"]["createdAt"].replace("Z", "+00:00"))
    return (first_review_time - created_at) >= timedelta(hours=1)

def fetch_valid_prs(repo_node, pr_limit):
    owner = repo_node["node"]["owner"]["login"]
    name = repo_node["node"]["name"]

    if not has_minimum_prs(owner, name):
        print(f"🔽 {owner}/{name} ignorado — menos de 100 PRs.")
        return None

    data = get_info(QUERY_PULL_REQUESTS_TEMPLATE, {"owner": owner, "name": name, "limit": pr_limit})
    if not data:
        return None

    try:
        all_prs = data["data"]["repository"]["pullRequests"]["edges"]
        valid_prs = [pr["node"] for pr in all_prs if review_time_valid(pr["node"])]

        if valid_prs:
            print(f"✅ {len(valid_prs)} PRs válidos de {owner}/{name}")
            return {"repository": f"{owner}/{name}", "valid_prs": valid_prs}
        else:
            print(f"⚠️ Nenhum PR válido em {owner}/{name}")
    except Exception as e:
        print(f"❌ Erro ao processar {owner}/{name}: {e}")
    return None

def collect_valid_prs_from_repositories():
    valid_results = []
    processed_repos = 0
    repo_generator = get_top_repositories()

    print("🚀 Iniciando coleta de PRs válidos...")

    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_REQUESTS) as executor:
        futures = []

        while processed_repos < TARGET_VALID_REPOS:
            try:
                repo = next(repo_generator)
                processed_repos += 1
                futures.append(executor.submit(fetch_valid_prs, repo, PR_FETCH_LIMIT))
                time.sleep(DELAY_BETWEEN_REQUESTS)
            except StopIteration:
                break

        for future in as_completed(futures):
            result = future.result()
            if result:
                valid_results.append(result)

    print(f"🎯 Coleta finalizada: {len(valid_results)} repositórios com PRs válidos (de {processed_repos} processados).")
    return valid_results
