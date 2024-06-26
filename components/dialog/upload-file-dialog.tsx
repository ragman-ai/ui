"use client";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadIcon } from "@radix-ui/react-icons";
import * as z from "zod";
import React, { ReactElement, ReactNode, useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import FileUpload from "@/components/FileUpload";
import { useToast } from "../ui/use-toast";
import { CustomDropzone } from "../file-upload";
import { IndexSelector } from "@/components/select/index-selector";
import { SplitterSelector } from "@/components/select/splitter-selector";
import { CreateDirItemRequest } from "@/constants/directory";
import { directoryItemsApi } from "@/app/api/api";
import PropTypes from "prop-types";

type ProductFormValues = z.infer<typeof formSchema>;
export const IMG_MAX_LIMIT = 3;

const formSchema = z.object({
  units: z.coerce.number(),
  overlap: z.coerce.number(),
  files: z.array(z.unknown()),
  splitter: z.string().min(3, { message: "The chunker name must be valid" }),
  category: z.string().min(1, { message: "Please select a category" }),
});

interface ProductFormProps {
  initialData?: any;
  buttonName?: string;
  showIcon?: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function UploadDialog({
  initialData,
  buttonName,
  showIcon,
  isOpen,
  setIsOpen,
}: ProductFormProps) {
  const defaultValues = initialData
    ? initialData
    : {
        name: "",
        description: "",
        price: 0,
        imgUrl: [],
        category: "",
        units: 100,
        overlap: 50,
        splitter: "chunker",
      };

  const { toast } = useToast();
  // const [loading, setLoading] = useState(false);
  const [successFileNames, setSuccessFileNames] = useState<string[]>([]);
  const [failedFileNames, setFailedFileNames] = useState<string[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const handleRemoveFile = useCallback(
    (file: File) => {
      const fs = files.filter((f) => f.name != file.name);
      setFiles(fs);
    },
    [files],
  );
  const handleAddFiles = useCallback(
    (newFiles: File[]) => {
      setFiles(files.concat(newFiles));
    },
    [files, setFiles],
  );
  // const createDirItem = (
  //   request: CreateDirItemRequest,
  // ): Promise<AxiosResponse> => {
  //   const formData = new FormData();
  //   request.file && formData.append("file", request.file);
  //   request.name && formData.append("name", request.name);
  //   request.description && formData.append("description", request.description);
  //   request.parent_id && formData.append("parent_id", request.parent_id);
  //   request.tags && formData.append("tags", request.tags.toString());
  //   request.is_external_integration &&
  //     formData.append(
  //       "is_external_integration",
  //       request.is_external_integration.toString(),
  //     );
  //   const config = {
  //     headers: {
  //       "content-type": "multipart/form-data",
  //       "Access-Control-Allow-Origin": "*",
  //       "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  //     },
  //   };
  //   const res = axios.post(endpoints.directory.item.root, formData, config);
  //   return res;
  // };

  const [createDirItem, { isLoading }] =
    directoryItemsApi.useCreateDirectoryItemMutation();
  isLoading;
  const uploadFileMultipart = useCallback(
    async (file: File) => {
      const request: CreateDirItemRequest = {
        name: file.name,
        file: file,
        description: "",
        parent_id: undefined,
        tags: ["test"],
        //is_external_integration: false
      };
      await createDirItem(request);
    },
    [createDirItem],
  );

  // const getFileState = useCallback(
  //   (fileName: string) => {
  //     if (failedFileNames.includes(fileName)) {
  //       return "error";
  //     }
  //     if (sucessFileNames.includes(fileName)) {
  //       return "success";
  //     } else return undefined;
  //   },
  //   [sucessFileNames, failedFileNames],
  // );

  // const isFailedFile = (fileName: string) => {
  //   return failedFileNames.includes(fileName);
  // };

  const handleUpload = useCallback(
    async (data: ProductFormValues) => {
      await Promise.all(
        files.map(async (file) => {
          await uploadFileMultipart(file)
            .then(() => {
              setSuccessFileNames([...successFileNames, file.name]);
            })
            .catch((error) => {
              setFailedFileNames([...failedFileNames, file.name]);
              throw error;
            });
        }),
      )
        .then(() => {
          toast({
            variant: "default",
            title: "Upload success",
          });
          setIsOpen(false);
          // onUpload ? onUpload() : {};
          // onClose();
        })
        .catch((error) => {
          if (error?.response?.status == 415) {
            toast({
              variant: "destructive",
              title: "File not supported.",
            });
          }
          if (error?.response?.status == 409) {
            toast({
              variant: "destructive",
              title: "File already exists",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Oh no! Something went wrong.",
            });
          }
        });
    },
    [
      files,
      failedFileNames,
      setSuccessFileNames,
      toast,
      uploadFileMultipart,
      successFileNames,
    ],
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // const units = form.watch("units");
  // const overlap = form.watch("overlap");

  // const isValid: boolean = useMemo(() => {
  //   return units > overlap && files.length > 0;
  // }, [units, overlap, files]);

  return (
    <div>
      <Dialog
        open={isOpen}
        onOpenChange={() => {
          setFiles([]);
          if (isOpen) {
            setIsOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
            <DialogDescription>
              The files are indexed and splitted according to the selected
              settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              // onSubmit={form.handleSubmit(handleUpload)}
              className="space-y-8 w-full"
            >
              <FormField
                control={form.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CustomDropzone
                        files={files}
                        onAdd={handleAddFiles}
                        onRemove={handleRemoveFile}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="gap-10">
                <div className="md:grid md:grid-cols-3 gap-8">
                  <FormField
                    control={form.control}
                    name="splitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Splitter</FormLabel>
                        <FormControl>
                          <SplitterSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={10}
                            disabled={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overlap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overlap</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={10}
                            disabled={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index</FormLabel>
                    <FormControl>
                      <IndexSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    {/* // </Select> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              onClick={async () => {
                await handleUpload(form.getValues());
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
