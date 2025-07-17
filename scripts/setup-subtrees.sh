#!/bin/bash

# Git Subtree Setup Script for Skyfire Solutions Smart Web Crawler Demo
# This script sets up git subtrees for the three main components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the root of your git repository."
    exit 1
fi

# Function to add subtree
add_subtree() {
    local prefix=$1
    local remote_url=$2
    local branch=${3:-main}
    
    print_status "Adding subtree: $prefix"
    
    if [ -d "$prefix" ]; then
        print_warning "Directory $prefix already exists. Checking if it's a git subtree..."
        
        # Check if the directory is already a subtree
        if git log --oneline --prefix="$prefix" | head -1 | grep -q "Add '$prefix' from commit"; then
            print_status "Directory $prefix is already a subtree. Updating instead..."
            git subtree pull --prefix="$prefix" "$remote_url" "$branch" --squash
        else
            print_warning "Directory $prefix exists but is not a subtree. Please remove it manually or commit/stash your changes first."
            print_error "Cannot add subtree: $prefix - directory exists with uncommitted changes"
            return 1
        fi
    else
        git subtree add --prefix="$prefix" "$remote_url" "$branch" --squash
    fi
    
    print_success "Successfully processed subtree: $prefix"
}

# Function to update subtree
update_subtree() {
    local prefix=$1
    local remote_url=$2
    local branch=${3:-main}
    
    print_status "Updating subtree: $prefix"
    git subtree pull --prefix="$prefix" "$remote_url" "$branch" --squash
    print_success "Successfully updated subtree: $prefix"
}

# Function to remove subtree
remove_subtree() {
    local prefix=$1
    
    print_status "Removing subtree: $prefix"
    git subtree split --prefix="$prefix" --ignore-joins
    git rm -rf "$prefix"
    print_success "Successfully removed subtree: $prefix"
}

# Function to clean existing directories
clean_directory() {
    local prefix=$1
    
    print_status "Cleaning directory: $prefix"
    
    if [ -d "$prefix" ]; then
        print_warning "Removing existing directory: $prefix"
        rm -rf "$prefix"
        print_success "Successfully removed directory: $prefix"
    else
        print_status "Directory $prefix does not exist. Nothing to clean."
    fi
}

# Main execution
main() {
    print_status "Starting git subtree setup..."
    
    case "${1:-add}" in
        "add")
            print_status "Adding all subtrees..."
            add_subtree "crawler-agent-core" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-service-demo.git"
            add_subtree "crawler-agent-fe" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-demo.git"
            add_subtree "crawler-bot-protection-proxy" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-bot-protection-proxy.git"
            ;;
        "update")
            print_status "Updating all subtrees..."
            update_subtree "crawler-agent-core" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-service-demo.git"
            update_subtree "crawler-agent-fe" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-demo.git"
            update_subtree "crawler-bot-protection-proxy" "git@github.com:skyfire-xyz/skyfire-solutions-crawler-bot-protection-proxy.git"
            ;;
        "remove")
            print_status "Removing all subtrees..."
            remove_subtree "crawler-agent-core"
            remove_subtree "crawler-agent-fe"
            remove_subtree "crawler-bot-protection-proxy"
            ;;
        "clean")
            print_status "Cleaning all directories..."
            clean_directory "crawler-agent-core"
            clean_directory "crawler-agent-fe"
            clean_directory "crawler-bot-protection-proxy"
            ;;
        *)
            print_error "Invalid action. Use: add, update, remove, or clean"
            echo "Usage: $0 [add|update|remove|clean]"
            exit 1
            ;;
    esac
    
    print_success "Git subtree operation completed successfully!"
}

# Run main function with all arguments
main "$@" 