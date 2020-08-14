#!/bin/bash

mkdir $TRAVIS_BUILD_DIR/gh-pages
cd $TRAVIS_BUILD_DIR/gh-pages

OLD_COVERAGE=0
NEW_COVERAGE=0
RESULT_MESSAGE=""

BADGE_COLOR=red
GREEN_THRESHOLD=85
YELLOW_THRESHOLD=50

# clone and prepare gh-pages branch
echo "clone and prepare gh-pages branch"
git clone -b gh-pages https://$GHE_USER:$GHE_TOKEN@github.ibm.com/$TRAVIS_REPO_SLUG.git .
git config user.name "travis"
git config user.email "travis"

if [ ! -d "$TRAVIS_BUILD_DIR/gh-pages/coverage" ]; then
	mkdir "$TRAVIS_BUILD_DIR/gh-pages/coverage"
fi

if [ ! -d "$TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH" ]; then
	mkdir "$TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH"
fi

if [ ! -d "$TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_COMMIT" ]; then
	mkdir "$TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_COMMIT"
fi

# Compute overall coverage percentage
echo "Compute overall coverage percentage"
OLD_COVERAGE=$(echo `$TRAVIS_BUILD_DIR/node_modules/.bin/coverage-average $TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH/text_summary.txt` | awk '{ print $4}' | sed 's/%//g' | cat -v)
NEW_COVERAGE=$(echo `$TRAVIS_BUILD_DIR/node_modules/.bin/coverage-average $TRAVIS_BUILD_DIR/coverage/text_summary.txt` | awk '{ print $4}' | sed 's/%//g' | cat -v)

cp -r $TRAVIS_BUILD_DIR/coverage/* $TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH
cp -r $TRAVIS_BUILD_DIR/coverage/* $TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_COMMIT

echo `$TRAVIS_BUILD_DIR/node_modules/.bin/coverage-average $TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH/text_summary.txt --limit 1`
echo `$TRAVIS_BUILD_DIR/node_modules/.bin/coverage-average $TRAVIS_BUILD_DIR/coverage/text_summary.txt --limit 1`

echo "compare coverage percentage"
if (( $(echo "$NEW_COVERAGE > $GREEN_THRESHOLD" | bc -l) )); then
	BADGE_COLOR="green"
elif (( $(echo "$NEW_COVERAGE > $YELLOW_THRESHOLD" | bc -l) )); then
	BADGE_COLOR="yellow"
fi

# Generate badge for coverage
echo "Generate badge for coverage"
curl -g https://img.shields.io/badge/Coverage-$NEW_COVERAGE%25-$BADGE_COLOR.svg > $TRAVIS_BUILD_DIR/gh-pages/coverage/$TRAVIS_BRANCH/badge.svg

COMMIT_RANGE=(${TRAVIS_COMMIT_RANGE//.../ })

# Generate result message for log and PR
echo "Generate result message for log and PR"
if (( $(echo "$OLD_COVERAGE > $NEW_COVERAGE" | bc -l) )); then
	RESULT_MESSAGE=":red_circle: Coverage decreased from [$OLD_COVERAGE%](https://pages.github.ibm.com/$TRAVIS_REPO_SLUG/coverage/${COMMIT_RANGE[0]}/index.html) to [$NEW_COVERAGE%](https://pages.github.ibm.com/$TRAVIS_REPO_SLUG/coverage/${COMMIT_RANGE[1]}/index.html)"
elif (( $(echo "$OLD_COVERAGE == $NEW_COVERAGE" | bc -l) )); then
	RESULT_MESSAGE=":thumbsup: Coverage remained same at [$NEW_COVERAGE%](https://pages.github.ibm.com/$TRAVIS_REPO_SLUG/coverage/${COMMIT_RANGE[1]}/index.html)"
else
	RESULT_MESSAGE=":thumbsup: Coverage increased from [$OLD_COVERAGE%](https://pages.github.ibm.com/$TRAVIS_REPO_SLUG/coverage/${COMMIT_RANGE[0]}/index.html) to [$NEW_COVERAGE%](https://pages.github.ibm.com/$TRAVIS_REPO_SLUG/coverage/${COMMIT_RANGE[1]}/index.html)"
fi

# Update gh-pages branch or PR
echo "Update gh-pages branch or PR"

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
	git status
	git add .
	git commit -m "Coverage result for commit $TRAVIS_COMMIT from build $TRAVIS_BUILD_NUMBER"
	git push origin
else
	curl -X POST -H "Authorization: token $GHE_TOKEN" https://github.ibm.com/api/v3/repos/$TRAVIS_REPO_SLUG/issues/$TRAVIS_PULL_REQUEST/comments -H 'Content-Type: application/json' --data '{"body": "'"$RESULT_MESSAGE"'"}'
fi
echo "done publishCoverage.sh"
