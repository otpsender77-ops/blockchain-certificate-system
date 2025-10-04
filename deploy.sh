#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run 'git init' first."
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    echo "Run: git add . && git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Git status clean"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
node_modules/
.env
.env.local
.env.production
temp/
*.log
.DS_Store
Thumbs.db
EOF
fi

echo "📦 Preparing for deployment..."

# Check if all required files exist
required_files=("package.json" "server.production.js" "vercel.json" "render.yaml")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"

echo ""
echo "🎯 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy frontend to Vercel:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Import your repository"
echo "   - Configure as static site with public/ as root"
echo "3. Deploy backend to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Create new Web Service"
echo "   - Connect your repository"
echo "   - Use render.yaml configuration"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "✅ Deployment preparation complete!"
