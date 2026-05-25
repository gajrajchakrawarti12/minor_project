function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)]">
            <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
            <p className="text-lg text-gray-600 mb-6">The page you are looking for does not exist.</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => window.location.replace("/")}>
                Go to Home
            </button>
        </div>
    );
}

export default NotFound;