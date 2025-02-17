import { fetchAllRepositories } from './repositories.js';
const { request, gql } = await import('graphql-request');  // Importação dinâmica

const gitAuthToken = "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";
const GIT_GRAPHQL_URL = "https://api.github.com/graphql";
const consideredReleasesNumber = 10;

const getReleasesCount = async (repoOwner, repoName) => {
    try {
        let totalReleases = 0;
        let cursor = null;
        const perPage = 100;
        const maxPages = 10;

        for (let page = 0; page < maxPages; page++) {
            const query = gql`
                query($owner: String!, $repo: String!, $perPage: Int!, $cursor: String) {
                    repository(owner: $owner, name: $repo) {
                        refs(refPrefix: "refs/tags/", first: $perPage, after: $cursor) {
                            totalCount
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }
                }
            `;

            const variables = {
                owner: repoOwner,
                repo: repoName,
                perPage: perPage,
                cursor: cursor,
            };

            const response = await request(GIT_GRAPHQL_URL, query, variables, {
                Authorization: `Bearer ${gitAuthToken}`,
                "User-Agent": "GraphQL-Client",
            });
            

            const releasesData = response.repository.refs;
            totalReleases += releasesData.totalCount;

            cursor = releasesData.pageInfo.endCursor;

            if (!releasesData.pageInfo.hasNextPage) break;
        }

        return totalReleases;
    } catch (error) {
        console.error("Erro ao buscar Releases:", error);
        return 0;
    }
};

async function getPercentReleases() {
    const arrayRepositories = await fetchAllRepositories();

    const results = await Promise.all(arrayRepositories.map(async (repo) => {
        const releasesCount = await getReleasesCount(repo.owner.login, repo.name);
        return releasesCount > consideredReleasesNumber ? 1 : 0;
    }));

    const numberOfReposWithMoreThan100Releases = results.reduce((acc, val) => acc + val, 0);
    const totalRepositories = arrayRepositories.length;

    return (numberOfReposWithMoreThan100Releases / totalRepositories) * 100;
}


export {
    getPercentReleases
};
