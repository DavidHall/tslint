/**
 * @license
 * Copyright 2015 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as ts from "typescript";

import * as Lint from "../index";

export class Rule extends Lint.Rules.AbstractRule {
    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "no-var-keyword",
        description: "Disallows usage of the `var` keyword.",
        descriptionDetails: "Use `let` or `const` instead.",
        hasFix: true,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: ["true"],
        type: "functionality",
        typescriptOnly: false,
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING = "Forbidden 'var' keyword, use 'let' or 'const' instead";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const noVarKeywordWalker = new NoVarKeywordWalker(sourceFile, this.getOptions());
        return this.applyWithWalker(noVarKeywordWalker);
    }
}

class NoVarKeywordWalker extends Lint.RuleWalker {
    public visitVariableStatement(node: ts.VariableStatement) {
        if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.DeclareKeyword)
                && !Lint.isBlockScopedVariable(node)) {
            this.reportFailure(node.declarationList);
        }

        super.visitVariableStatement(node);
    }

    public visitForStatement(node: ts.ForStatement) {
        this.handleInitializerNode(node.initializer);
        super.visitForStatement(node);
    }

    public visitForInStatement(node: ts.ForInStatement) {
        this.handleInitializerNode(node.initializer);
        super.visitForInStatement(node);
    }

    public visitForOfStatement(node: ts.ForOfStatement) {
        this.handleInitializerNode(node.initializer);
        super.visitForOfStatement(node);
    }

    private handleInitializerNode(node: ts.VariableDeclarationList | ts.Expression | undefined) {
        if (node && node.kind === ts.SyntaxKind.VariableDeclarationList &&
                !(Lint.isNodeFlagSet(node, ts.NodeFlags.Let) || Lint.isNodeFlagSet(node, ts.NodeFlags.Const))) {
            this.reportFailure(node);
        }
    }

    private reportFailure(node: ts.Node) {
        const nodeStart = node.getStart(this.getSourceFile());
        this.addFailureAt(nodeStart, "var".length, Rule.FAILURE_STRING, this.createFix(
            this.createReplacement(nodeStart, "var".length, "let"),
        ));
    }
}
