const Inventory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground text-sm">Manage your product stock levels.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[calc(100vh-250px)]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Inventory management is coming soon
          </h3>
          <p className="text-sm text-muted-foreground">
            You will soon be able to add, edit, and track your products here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
