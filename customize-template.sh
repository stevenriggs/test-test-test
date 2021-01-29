APP_NAME="Awesome App"
APP_DESCRIPTION="Awesome App application created by UK HealthCare."
APP_REPO_NAME="awesomeapp"

sed -i '' "s/<<APP_NAME>>/$APP_NAME/" ./public/index.html
sed -i '' "s/<<APP_DESCRIPTION>>/$APP_DESCRIPTION/" ./public/index.html
sed -i '' "s/<<APP_REPO_NAME>>/$APP_REPO_NAME/" ./README.md

# <<APP_NAME>>
# <<APP_DESCRIPTION>>
# <<APP_REPO_NAME>>