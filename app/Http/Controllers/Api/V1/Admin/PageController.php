<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function update(UpdatePageRequest $request, Page $page): JsonResponse
    {
        $page->fill($request->validated());
        $page->updated_by = $request->user()->id;
        $page->save();

        return response()->json([
            'message' => 'Page updated successfully.',
            'data' => $page->fresh(),
        ]);
    }
}
