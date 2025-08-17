export async function GET() {
  return Response.json({
    todo: [
      { id: 'task-1', content: 'Vajab tegemist' },
    ],
    done: [
      { id: 'task-2', content: 'Valmis töö' },
    ],
  });
}
