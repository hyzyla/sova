import type { NextPage } from "next";
import Head from "next/head";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { promises as fs } from "fs";
import path from "path";
import { render } from "@react-email/render";
import { GetStaticPaths } from "next";

interface PreviewProps {
  navItems: string;
  markup: string;
  reactMarkup: string;
  slug: string;
  plainText: string;
}

export const CONTENT_DIR = "emails";

const getEmails = async () => {
  const emailsDirectory = path.join(process.cwd(), CONTENT_DIR);
  const filenames = await fs.readdir(emailsDirectory);
  const emails = filenames
    .map((file) => file.replace(/\.(jsx|tsx)$/g, ""))
    .filter((file) => file !== "components");
  return { emails, filenames };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { emails } = await getEmails();
  const paths = emails.map((email) => {
    return { params: { slug: email } };
  });
  return { paths, fallback: true };
};

export async function getStaticProps({ params }) {
  try {
    const { emails, filenames } = await getEmails();
    const template = filenames.filter((email) => {
      const [fileName] = email.split(".");
      return params.slug === fileName;
    });

    const Email = (await import(`../emails/${params.slug}`)).default;
    const markup = render(<Email />, { pretty: true });
    const plainText = render(<Email />, { plainText: true });
    const path = `${process.cwd()}/${CONTENT_DIR}/${template[0]}`;
    const reactMarkup = await fs.readFile(path, {
      encoding: "utf-8",
    });

    return emails
      ? {
          props: {
            navItems: emails,
            slug: params.slug,
            markup,
            reactMarkup,
            plainText,
          },
        }
      : { notFound: true };
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }
}

const ResizeHandle = () => {
  return (
    <PanelResizeHandle>
      <div className="w-5 h-full cursor-col-resize"></div>
    </PanelResizeHandle>
  );
};

const ResizePanel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Panel className="rounded-lg bg-white shadow h-full p-3">{children}</Panel>
  );
};

const Home: NextPage<PreviewProps> = (props) => {
  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-screen bg-gray-100">
        <PanelGroup direction="horizontal" className="p-5">
          <ResizePanel>
            <pre className="text-sm text-gray-800">
              <code className="overflow-scroll">{props.reactMarkup}</code>
            </pre>
          </ResizePanel>
          <ResizeHandle />
          <ResizePanel>
            <iframe srcDoc={props.markup} className="w-full h-full"></iframe>
          </ResizePanel>
        </PanelGroup>
      </main>
    </div>
  );
};

export default Home;
