import requests
import os
import time
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

load_dotenv()
GITHUB_TOKEN = os.getenv("GIT_AUTH_TOKEN")
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
MAX_GRAPHQL_POINTS_PER_MINUTE = 1900
MAX_CONCURRENT_REQUESTS = 5
DELAY_BETWEEN_REQUESTS = 1  # segundos entre requisições
TARGET_VALID_REPOS = 100
PR_FETCH_LIMIT = 20  # quantidade de PRs por repositório

def get_info(query, variables={}, retries=3):
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    for attempt in range(retries):
        response = requests.post(
            GITHUB_GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers=headers
        )
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403 and "secondary rate limit" in response.text.lower():
            wait_time = 60 * (attempt + 1)
            print(f"⏳ Rate limit atingido. Aguardando {wait_time} segundos antes do retry...")
            time.sleep(wait_time)
        else:
            raise Exception(f"Query falhou! Código {response.status_code}: {response.text}")
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

def get_top_repositories(batch_size=50):
    cursor = None
    while True:
        variables = {"cursor": cursor}
        data = get_info(QUERY_REPOSITORIES, variables)
        if not data:
            break

        edges = data["data"]["search"]["edges"]
        for repo in edges:
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
    variables = {"owner": owner, "name": name, "limit": pr_limit}
    try:
        data = get_info(QUERY_PULL_REQUESTS_TEMPLATE, variables)
        if data and "data" in data and data["data"]["repository"]:
            all_prs = data["data"]["repository"]["pullRequests"]["edges"]
            valid_prs = [pr["node"] for pr in all_prs if review_time_valid(pr["node"])]
            if valid_prs:
                print(f"✅ {len(valid_prs)} PRs válidos de {owner}/{name}")
                return {
                    "repository": f"{owner}/{name}",
                    "valid_prs": valid_prs
                }
            else:
                print(f"⚠️ Nenhum PR válido em {owner}/{name}")
        else:
            print(f"⚠️ Nenhum dado retornado para {owner}/{name}: {data}")
    except Exception as e:
        print(f"❌ Erro ao buscar PRs de {owner}/{name}: {e}")
    return None

def collect_valid_prs_from_repositories():
    valid_results = []
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_REQUESTS) as executor:
        repo_generator = get_top_repositories()
        futures = []
        for repo in repo_generator:
            if len(valid_results) >= TARGET_VALID_REPOS:
                break
            future = executor.submit(fetch_valid_prs, repo, PR_FETCH_LIMIT)
            futures.append(future)
            time.sleep(DELAY_BETWEEN_REQUESTS)

            for future in as_completed(futures):
                result = future.result()
                if result:
                    valid_results.append(result)
                    if len(valid_results) >= TARGET_VALID_REPOS:
                        break
                futures.remove(future)

    print(f"🎯 Total de repositórios com PRs válidos: {len(valid_results)}")
    return valid_results
